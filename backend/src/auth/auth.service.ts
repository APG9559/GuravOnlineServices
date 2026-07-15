import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

// Trigger compilation restart
import { UsersService } from "../users/users.service";
import { LoginDto } from "./auth.dto";
import { Passkey } from "./passkey.entity";

// SHA-256 hash of the app's release signing certificate (base64url, no padding),
// matching the value served at /.well-known/assetlinks.json in main.ts.
// This is the ONLY Android origin we trust for WebAuthn — it must never be
// taken from client-supplied data, or origin validation is meaningless.
const TRUSTED_ANDROID_APK_KEY_HASH =
  "Vo_KYfi6AEJknVYVHHwSDhvDM298EWXpuWNc-hapfMY";
const TRUSTED_ANDROID_ORIGIN = `android:apk-key-hash:${TRUSTED_ANDROID_APK_KEY_HASH}`;

@Injectable()
export class AuthService {
  private readonly registrationChallenges = new Map<
    string,
    { challenge: string; userId: string }
  >();
  private readonly authenticationChallenges = new Map<
    string,
    { challenge: string }
  >();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Passkey)
    private readonly passkeyRepository: Repository<Passkey>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailOrName(dto.email);
    if (!user || !user.isActive)
      throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        signature: user.signature,
        avatar: user.avatar,
      },
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findOne(userId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      signature: user.signature,
      avatar: user.avatar,
    };
  }

  async resetPassword(userId: string, newPassword: string) {
    await this.usersService.updatePasswordAndClearFirstLogin(
      userId,
      newPassword,
    );
    return { success: true };
  }

  async updateProfile(userId: string, name?: string, signature?: string, avatar?: string) {
    const user = await this.usersService.updateProfile(userId, name, signature, avatar);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      signature: user.signature,
      avatar: user.avatar,
    };
  }

  // --- WebAuthn Passkeys ---

  async getRegisterOptions(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new UnauthorizedException("User not found");

    const userPasskeys = await this.passkeyRepository.find({
      where: { user: { id: userId } },
    });

    const options = await generateRegistrationOptions({
      rpName: "Gurav Online Services",
      rpID: process.env.RP_ID || "localhost",
      userID: Buffer.from(user.id).toString("base64url"),
      userName: user.email,
      userDisplayName: user.name,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      excludeCredentials: userPasskeys.map((pk) => ({
        id: Buffer.from(pk.credentialID, "base64url"),
        type: "public-key",
      })),
    });

    const sessionId = Math.random().toString(36).substring(2, 15);
    this.registrationChallenges.set(sessionId, {
      challenge: options.challenge,
      userId,
    });
    setTimeout(
      () => this.registrationChallenges.delete(sessionId),
      5 * 60 * 1000,
    );

    return { options, sessionId };
  }

  async verifyRegister(sessionId: string, body: any) {
    const savedChallenge = this.registrationChallenges.get(sessionId);
    if (!savedChallenge)
      throw new UnauthorizedException(
        "Registration session expired or invalid",
      );
    this.registrationChallenges.delete(sessionId);

    const user = await this.usersService.findOne(savedChallenge.userId);
    if (!user) throw new UnauthorizedException("User not found");

    const expectedChallenge = savedChallenge.challenge;

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost",
      "capacitor://localhost",
      process.env.FRONTEND_URL,
      // Only ever the known-good APK signing-cert hash — never a value read
      // from the client's own clientDataJSON.
      TRUSTED_ANDROID_ORIGIN,
    ].filter(Boolean);

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: allowedOrigins,
        expectedRPID: process.env.RP_ID || "localhost",
      });
    } catch (error) {
      throw new UnauthorizedException(`Verification failed: ${error.message}`);
    }

    const { verified, registrationInfo } = verification;
    if (!verified || !registrationInfo) {
      throw new UnauthorizedException("Registration verification failed");
    }

    const {
      credentialPublicKey,
      credentialID,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = registrationInfo;
    const base64UrlCredentialID =
      Buffer.from(credentialID).toString("base64url");

    const passkey = new Passkey();
    passkey.credentialID = base64UrlCredentialID;
    passkey.publicKey = Buffer.from(credentialPublicKey);
    passkey.counter = counter;
    passkey.deviceType = credentialDeviceType;
    passkey.backedUp = credentialBackedUp;
    passkey.transports = body.response.transports || [];
    passkey.user = user;

    await this.passkeyRepository.save(passkey);

    return { success: true };
  }

  async getLoginOptions() {
    const options = await generateAuthenticationOptions({
      rpID: process.env.RP_ID || "localhost",
      userVerification: "preferred",
    });

    const sessionId = Math.random().toString(36).substring(2, 15);
    this.authenticationChallenges.set(sessionId, {
      challenge: options.challenge,
    });
    setTimeout(
      () => this.authenticationChallenges.delete(sessionId),
      5 * 60 * 1000,
    );

    return { options, sessionId };
  }

  async verifyLogin(sessionId: string, body: any) {
    const savedChallenge = this.authenticationChallenges.get(sessionId);
    if (!savedChallenge)
      throw new UnauthorizedException(
        "Authentication session expired or invalid",
      );
    this.authenticationChallenges.delete(sessionId);

    const credentialIdStr = body.id;

    const passkey = await this.passkeyRepository.findOne({
      where: { credentialID: credentialIdStr },
      relations: ["user"],
    });
    if (!passkey) throw new UnauthorizedException("Passkey not registered");
    if (!passkey.user || !passkey.user.isActive)
      throw new UnauthorizedException("User account is disabled");

    const expectedChallenge = savedChallenge.challenge;

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost",
      "capacitor://localhost",
      process.env.FRONTEND_URL,
      // Only ever the known-good APK signing-cert hash — never a value read
      // from the client's own clientDataJSON.
      TRUSTED_ANDROID_ORIGIN,
    ].filter(Boolean);

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: allowedOrigins,
        expectedRPID: process.env.RP_ID || "localhost",
        authenticator: {
          credentialID: Buffer.from(passkey.credentialID, "base64url"),
          credentialPublicKey: passkey.publicKey,
          counter: passkey.counter,
        },
      });
    } catch (error) {
      throw new UnauthorizedException(`Verification failed: ${error.message}`);
    }

    const { verified, authenticationInfo } = verification;
    if (!verified || !authenticationInfo) {
      throw new UnauthorizedException("Authentication verification failed");
    }

    passkey.counter = authenticationInfo.newCounter;
    await this.passkeyRepository.save(passkey);

    const payload = {
      sub: passkey.user.id,
      email: passkey.user.email,
      role: passkey.user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: passkey.user.id,
        name: passkey.user.name,
        email: passkey.user.email,
        role: passkey.user.role,
        isFirstLogin: passkey.user.isFirstLogin,
        signature: passkey.user.signature,
        avatar: passkey.user.avatar,
      },
    };
  }
}
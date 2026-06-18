export enum Role {
  ADMIN = 'admin',
  OPERATOR = 'operator',
}

export enum PaperType {
  STAMP500 = 'stamp500',
  PLAIN = 'Plain',
}

export enum AuthorizerType {
  MAGISTRATE = 'magistrate',
  NOTARY = 'Notary',
}

export enum MarriageAct {
  HINDU = 'Hindu Marriage Act',
  MUSLIM = 'Muslim Personal Law (Shariat)',
  CHRISTIAN = 'Indian Christian Marriage Act',
}

export enum CertificateType {
  BIRTH = 'Birth',
  DEATH = 'Death',
}

export const PRICING = {
  MAGISTRATE_FEE: 850,
  NOTARY_FEE: 600,
  STAMP500_COST: 500,
  PLAIN_COST: 0,
  ONLINE_FORM: 300,
  OFFLINE_FORM: 300,
  TRUE_COPY: 100,
  BIRTH_DEATH_FIRST_COPY: 300,
  BIRTH_DEATH_EXTRA_COPY: 50,
} as const;

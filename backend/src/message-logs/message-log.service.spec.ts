import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageLogService } from './message-log.service';
import { MessageLog } from './message-log.entity';
import { User } from '../users/user.entity';

describe('MessageLogService', () => {
  let service: MessageLogService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Operator',
  };

  const mockLog: MessageLog = {
    id: 'msg-1',
    module: 'tradeLicenses',
    templateId: 'tl_renewal',
    templateLabel: 'Renewal Reminder',
    channel: 'whatsapp',
    recipientName: 'Suresh Jadhav',
    recipientPhone: '9876543210',
    messageBody: 'Dear Suresh, your trade license is due for renewal.',
    recordId: 'tl-100',
    sentBy: mockUser as User,
    createdAt: new Date('2026-07-10T10:00:00Z'),
  } as MessageLog;

  const mockRepo = {
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'msg-1', ...entity })),
    findAndCount: jest.fn().mockResolvedValue([[mockLog], 1]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageLogService,
        { provide: getRepositoryToken(MessageLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MessageLogService>(MessageLogService);
  });

  describe('create', () => {
    it('creates and saves a message log entry with user reference', async () => {
      const dto = {
        module: 'tradeLicenses',
        templateId: 'tl_renewal',
        templateLabel: 'Renewal Reminder',
        channel: 'whatsapp',
        recipientName: 'Suresh Jadhav',
        recipientPhone: '9876543210',
        messageBody: 'Dear Suresh, your trade license is due for renewal.',
        recordId: 'tl-100',
      };

      const result = await service.create(dto as any, mockUser as User);

      expect(mockRepo.create).toHaveBeenCalledWith({
        module: 'tradeLicenses',
        templateId: 'tl_renewal',
        templateLabel: 'Renewal Reminder',
        channel: 'whatsapp',
        recipientName: 'Suresh Jadhav',
        recipientPhone: '9876543210',
        messageBody: 'Dear Suresh, your trade license is due for renewal.',
        recordId: 'tl-100',
        sentBy: mockUser,
      });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('handles null optional fields gracefully', async () => {
      const dto = {
        module: 'affidavits',
        channel: 'sms',
        recipientPhone: '9876543210',
        messageBody: 'Test message',
      };

      await service.create(dto as any, null);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: null,
          templateLabel: null,
          recipientName: null,
          recordId: null,
          sentBy: null,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated message logs with filters applied', async () => {
      const result = await service.findAll({
        module: 'tradeLicenses',
        page: 1,
        limit: 20,
      });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
          take: 20,
          skip: 0,
          relations: ['sentBy'],
        }),
      );
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
    });

    it('caps limit at 100 even if higher is requested', async () => {
      const result = await service.findAll({ limit: 500 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('defaults to page 1 and limit 20 when not specified', async () => {
      const result = await service.findAll({});

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 0 }),
      );
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});

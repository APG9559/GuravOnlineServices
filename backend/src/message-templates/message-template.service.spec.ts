import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplate } from './message-template.entity';

describe('MessageTemplateService', () => {
  let service: MessageTemplateService;

  const mockTemplate: MessageTemplate = {
    id: 'tmpl-1',
    label: 'Renewal Reminder',
    modules: ['tradeLicenses', 'shopAct'],
    body: 'Dear {name}, your license is due for renewal.',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as MessageTemplate;

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockTemplate]),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'tmpl-1', ...entity })),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageTemplateService,
        { provide: getRepositoryToken(MessageTemplate), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<MessageTemplateService>(MessageTemplateService);
  });

  describe('findAll', () => {
    it('returns all templates ordered by label', async () => {
      const result = await service.findAll();
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { label: 'ASC' } });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns template by id', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockTemplate);
      const result = await service.findOne('tmpl-1');
      expect(result.label).toBe('Renewal Reminder');
    });

    it('throws NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and saves a new template', async () => {
      const dto = { label: 'Receipt', modules: ['marriages'], body: 'Received.' };
      const result = await service.create(dto as any);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('updates specified fields only', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ ...mockTemplate });
      await service.update('tmpl-1', { label: 'Updated' } as any);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Updated', body: mockTemplate.body }),
      );
    });
  });

  describe('remove', () => {
    it('removes an existing template', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockTemplate);
      await service.remove('tmpl-1');
      expect(mockRepo.remove).toHaveBeenCalledWith(mockTemplate);
    });

    it('throws NotFoundException if template missing', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.remove('bad')).rejects.toThrow(NotFoundException);
    });
  });
});

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationService } from './notification.service';
import { UserDTO } from '../types/user.dto';

@Processor('notifications')
export class NotificationProcessor {
  constructor(private readonly notificationService: NotificationService) {}

  @Process('sendNotification')
  async handleSendNotification(job: Job<UserDTO>) {
    await this.notificationService.sendNotification(job.data);
  }
}

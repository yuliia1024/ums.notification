import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { UserDTO } from '../types/user.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @RabbitSubscribe({
    exchange: 'user.exchange',
    routingKey: 'user.created',
    queue: 'notification-service-user-created',
  })
  public async handleUserCreated(user: UserDTO) {
    this.logger.log(`Received message: ${JSON.stringify(user)}`);

    const sendTime = new Date(user.createdAt);
    sendTime.setMinutes(sendTime.getHours() + 24);

    await this.notificationQueue.add(
      'sendNotification',
      user,
      { delay: sendTime.getTime() - new Date().getTime() },
    );
  }

  public async sendNotification(user: UserDTO) {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

    this.logger.log(`Sending notification to ${webhookUrl} with payload: ${JSON.stringify(user)}`);

    try {
      const response = await firstValueFrom(this.httpService.post(webhookUrl, {
       message: `Dear ${user.firstName} this is push notification about you created account!`,
       user,
      }));

      this.logger.log(`Notification sent successfully for userId: ${user.id}, response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      this.logger.error(`Failed to send notification for userId: ${user.id}`, error.stack);
      if (error.response) {
        this.logger.error(`Error response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

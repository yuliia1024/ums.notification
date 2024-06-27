import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { UserDTO } from '../types/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as moment from 'moment/moment';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource,
  ) {
  }

  @RabbitSubscribe({
    exchange: 'user.exchange',
    routingKey: 'user.created',
    queue: 'notification-service-user-created',
  })
  public async handleUserCreated(dto: { eventId: string, data: UserDTO }) {
    this.logger.log(`Received message: ${JSON.stringify(dto)}`);

    const sendTime = new Date(dto.data.createdAt);
    sendTime.setMinutes(sendTime.getMinutes() + 1);

    await this.notificationQueue.add(
      'sendNotification',
      dto,
      { delay: sendTime.getTime() - new Date().getTime() },
    );
  }

  public async sendNotification(dto: { eventId: string, data: UserDTO }) {
    const {eventId, data} = dto;
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

    this.logger.log(`Sending notification to ${webhookUrl} with payload: ${JSON.stringify(data)}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const response = await firstValueFrom(this.httpService.post(webhookUrl, {
        message: `Dear ${data.firstName} this is push notification about you created account!`,
        user: data,
      }));

      await this.notificationRepository.createQueryBuilder('notification', queryRunner)
        .update()
        .set({ sent: moment().format() })
        .where('id = :id', { id: eventId })
        .execute();

      this.logger.log(`Notification sent successfully for userId: ${data.id}, response: ${JSON.stringify(response.data)}`);
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(`Failed to send notification for userId: ${data.id}`, error.stack);

      await queryRunner.rollbackTransaction();

      if (error.response) {
        this.logger.error(`Error response: ${JSON.stringify(error.response.data)}`);
      }

      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);

    } finally {
      await queryRunner.release();
    }
  }
}

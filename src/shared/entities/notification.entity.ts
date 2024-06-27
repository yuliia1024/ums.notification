import { Entity, Column, PrimaryColumn, Generated } from 'typeorm';

@Entity()
export class Notification {

  @PrimaryColumn({ type:"uuid" })
  @Generated("uuid")
  id: string;

  @Column()
  type: string;

  @Column('jsonb', { nullable: false, default: {} })
  data: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
  published?: string;


  @Column({ type: "timestamp", nullable: true })
  sent?: string;
}
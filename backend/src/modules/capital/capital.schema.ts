import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CapitalDocument = HydratedDocument<Capital>;

@Schema({ timestamps: true })
export class Capital {
  @Prop({ required: true, default: 0 })
  value!: number;
}

export const CapitalSchema = SchemaFactory.createForClass(Capital);


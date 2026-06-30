import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  durationMins?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

import { Kafka, KafkaConfig, ProducerConfig } from "kafkajs";

export type KafkaProducerConfig = KafkaConfig & ProducerConfig;

export const getKafkaProducer = (config: KafkaProducerConfig) =>
  new Kafka(config).producer(config);

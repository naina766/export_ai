import amqp, { Channel, ConfirmChannel } from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://admin:admin123@localhost:5672";

class RabbitMQManager {
  private static instance: RabbitMQManager;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: any = null;
  private channel: Channel | null = null;
  private confirmChannel: ConfirmChannel | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): RabbitMQManager {
    if (!RabbitMQManager.instance) {
      RabbitMQManager.instance = new RabbitMQManager();
    }
    return RabbitMQManager.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getConnection(): Promise<any> {
    if (this.connection) return this.connection;
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return this.connection;
    }

    try {
      this.isConnecting = true;
      console.log(`[RabbitMQ] Connecting to broker at ${RABBITMQ_URL.replace(/:\/\/.*@/, "://***@")}...`);
      const conn = await amqp.connect(RABBITMQ_URL);
      this.connection = conn;

      if (conn) {
        conn.on("error", (err: Error) => {
          console.error("[RabbitMQ] Connection error:", err.message);
          this.reset();
        });

        conn.on("close", () => {
          console.warn("[RabbitMQ] Connection closed. Attempting reconnect in 5s...");
          this.reset();
        });
      }

      console.log("[RabbitMQ] Successfully connected.");
      this.isConnecting = false;
      return this.connection;
    } catch (error) {
      this.isConnecting = false;
      console.error("[RabbitMQ] Failed to connect:", (error as Error).message);
      return null;
    }
  }

  public async getChannel(): Promise<Channel | null> {
    if (this.channel) return this.channel;
    const conn = await this.getConnection();
    if (!conn) return null;

    try {
      const ch = await conn.createChannel();
      if (!ch) return null;

      ch.on("error", (err: Error) => {
        console.error("[RabbitMQ] Channel error:", err.message);
        this.channel = null;
      });
      ch.on("close", () => {
        console.warn("[RabbitMQ] Channel closed.");
        this.channel = null;
      });

      this.channel = ch;
      return this.channel;
    } catch (err) {
      console.error("[RabbitMQ] Failed to create channel:", (err as Error).message);
      return null;
    }
  }

  public async getConfirmChannel(): Promise<ConfirmChannel | null> {
    if (this.confirmChannel) return this.confirmChannel;
    const conn = await this.getConnection();
    if (!conn) return null;

    try {
      const ch: ConfirmChannel = await conn.createConfirmChannel();
      if (!ch) return null;

      ch.on("error", (err: Error) => {
        console.error("[RabbitMQ] Confirm channel error:", err.message);
        this.confirmChannel = null;
      });
      ch.on("close", () => {
        console.warn("[RabbitMQ] Confirm channel closed.");
        this.confirmChannel = null;
      });

      this.confirmChannel = ch;
      return this.confirmChannel;
    } catch (err) {
      console.error("[RabbitMQ] Failed to create confirm channel:", (err as Error).message);
      return null;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.confirmChannel) await this.confirmChannel.close().catch(() => {});
      if (this.channel) await this.channel.close().catch(() => {});
      if (this.connection) await this.connection.close().catch(() => {});
    } catch (err) {
      console.error("[RabbitMQ] Error while closing connection:", (err as Error).message);
    } finally {
      this.reset();
    }
  }

  private reset() {
    this.connection = null;
    this.channel = null;
    this.confirmChannel = null;
    this.isConnecting = false;
  }
}

export const rabbitmq = RabbitMQManager.getInstance();

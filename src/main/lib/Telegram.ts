import TelegramBot from 'node-telegram-bot-api'
export class TelegramService {
  private bot: TelegramBot | null = null
  private chatId: string = ''

  constructor(apiKey: string, chatId: string) {
    if (apiKey) {
      this.bot = new TelegramBot(apiKey, { polling: false })
      this.chatId = chatId
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.bot || !this.chatId) {
      throw new Error('Telegram bot or chatId is not configured.')
    }

    try {
      await this.bot.sendMessage(this.chatId, message)
      console.log('Message sent successfully')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }
  async verifyCredentials(): Promise<boolean> {
    if (!this.bot || !this.chatId) {
      return false
    }

    try {
      // Try to send a test message or get bot info to verify credentials
      await this.bot.getMe() // Verifies if the bot is valid
      return true
    } catch (error) {
      return false
    }
  }
}

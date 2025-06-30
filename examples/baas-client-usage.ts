import { createBaasClient } from "../src/node/client"

// Create a client with the api key
const client = createBaasClient({
  api_key: "your-api-key-here",
})

async function exampleUsage() {
    // Functions return a discriminated union of success and error
    const joinResult = await client.joinMeeting({
      meeting_url: "https://meet.google.com/abc-defg-hij",
      bot_name: "My Bot",
      reserved: false // Required field
    })

    if(joinResult.success) {
        console.log("Bot joined successfully:", joinResult.data.bot_id)
        
        // Get meeting data
        const meetingDataResult = await client.getMeetingData({
          bot_id: joinResult.data.bot_id
        })
        
        if(meetingDataResult.success) {
            console.log("Meeting data:", meetingDataResult.data)
        } else {
            console.error("Error getting meeting data:", meetingDataResult.error)
        }
    } else {
        console.error("Error joining meeting:", joinResult.error)
    }

    // List bots
    const botsResult = await client.listBots()
    if (botsResult.success) {
        console.log("Bots:", botsResult.data)
    } else {
        console.error("Error listing bots:", botsResult.error)
    }
}

// Example showing how to handle errors
async function exampleWithErrorHandling() {
  try {
    const joinResult = await client.joinMeeting({
      meeting_url: "https://meet.google.com/abc-defg-hij",
      bot_name: "My Bot",
      reserved: false // Required field
    })
    
    if (joinResult.success) {
      console.log("Bot joined successfully:", joinResult.data.bot_id)
    } else {
      console.error("Error joining meeting:", joinResult.error)
    }
  } catch (error) {
    // Handle any unexpected errors that occur
    console.error("Unexpected error occurred:", error)
  }
}

// Example with calendar operations
async function calendarExample() {
  try {
    // Create a calendar integration
    const calendarResult = await client.createCalendar({
      platform: "Google",
      oauth_client_id: "your-oauth-client-id",
      oauth_client_secret: "your-oauth-client-secret",
      oauth_refresh_token: "your-oauth-refresh-token"
    })
    
    if (calendarResult.success) {
      console.log("Calendar created:", calendarResult.data)

      // List all calendars
      const calendarsResult = await client.listCalendars()
      if (calendarsResult.success) {
        console.log("All calendars:", calendarsResult.data)
      } else {
        console.error("Error listing calendars:", calendarsResult.error)
      }

      // List events
      const eventsResult = await client.listCalendarEvents({
        calendar_id: calendarResult.data.calendar.uuid, // Use calendar.uuid from the response
        start_date_gte: new Date().toISOString(),
        start_date_lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      })
      
      if (eventsResult.success) {
        console.log("Events:", eventsResult.data)
      } else {
        console.error("Error listing events:", eventsResult.error)
      }
    } else {
      console.error("Error creating calendar:", calendarResult.error)
    }
  } catch (error) {
    console.error("Calendar operation failed:", error)
  }
}

// Advanced usage example
async function advancedUsage() {
  const advancedClient = createBaasClient({
    api_key: "your-api-key-here"
  })

  try {
    // Create a new calendar integration
    const newCalendarResult = await advancedClient.createCalendar({
      oauth_client_id: "your-oauth-client-id",
      oauth_client_secret: "your-oauth-client-secret",
      oauth_refresh_token: "your-oauth-refresh-token",
      platform: "Google"
    })
    
    if (newCalendarResult.success) {
      console.log(`Created calendar: ${newCalendarResult.data.calendar.email}`)
    } else {
      console.error("Error creating calendar:", newCalendarResult.error)
    }

    // Retranscribe a bot with custom settings
    const retranscribeResult = await advancedClient.retranscribeBot({
      bot_uuid: "bot-uuid-here",
      speech_to_text: {
        provider: "Gladia",
        api_key: "your-gladia-api-key"
      },
      webhook_url: "https://your-webhook.com/retranscribe"
    })
    
    if (retranscribeResult.success) {
      console.log("Bot retranscription initiated successfully")
    } else {
      console.error("Error retranscribing bot:", retranscribeResult.error)
    }

    // Get webhook documentation
    const webhookDocsResult = await advancedClient.getWebhookDocumentation()
    if (webhookDocsResult.success) {
      console.log("Webhook documentation:", webhookDocsResult.data)
    } else {
      console.error("Error getting webhook documentation:", webhookDocsResult.error)
    }
  } catch (error) {
    console.error("Error in advanced usage:", error)
  }
}

// Example showing how to handle different types of operations
async function comprehensiveExample() {
  const comprehensiveClient = createBaasClient({
    api_key: "your-api-key-here",
    base_url: "https://api.meetingbaas.com",
    timeout: 60000
  })

  try {
    // Join a meeting
    const joinResult = await comprehensiveClient.joinMeeting({
      meeting_url: "https://meet.google.com/abc-defg-hij",
      bot_name: "Comprehensive Test Bot",
      reserved: false,
      bot_image: "https://example.com/bot-image.jpg",
      enter_message: "Hello from the comprehensive test bot!",
      extra: { test_id: "comprehensive-example" },
      recording_mode: "speaker_view",
      speech_to_text: { provider: "Gladia" },
      webhook_url: "https://example.com/webhook"
    })

    if (joinResult.success) {
      const botId = joinResult.data.bot_id
      console.log("Bot joined with ID:", botId)

      // Get meeting data
      const meetingDataResult = await comprehensiveClient.getMeetingData({
        bot_id: botId,
        include_transcripts: true
      })

      if (meetingDataResult.success) {
        console.log("Meeting data retrieved successfully")
        console.log("Duration:", meetingDataResult.data.duration)
        console.log("Has MP4:", !!meetingDataResult.data.mp4)
      }

      // Leave the meeting
      const leaveResult = await comprehensiveClient.leaveMeeting({
        uuid: botId
      })

      if (leaveResult.success) {
        console.log("Bot left meeting successfully")
      }

      // Delete bot data
      const deleteResult = await comprehensiveClient.deleteBotData({
        uuid: botId
      })

      if (deleteResult.success) {
        console.log("Bot data deleted successfully")
      }
    }

    // List bots with filtering
    const botsResult = await comprehensiveClient.listBots({
      bot_name: "Test",
      limit: 10,
      meeting_url: "meet.google.com"
    })

    if (botsResult.success) {
      console.log(`Found ${botsResult.data.bots.length} bots`)
    }

    // Get screenshots (if any)
    const screenshotsResult = await comprehensiveClient.getScreenshots({
      uuid: "some-bot-uuid"
    })

    if (screenshotsResult.success) {
      console.log(`Found ${screenshotsResult.data.length} screenshots`)
    }

  } catch (error) {
    console.error("Comprehensive example failed:", error)
  }
}

// Export for use in other files
export { exampleUsage, exampleWithErrorHandling, calendarExample, advancedUsage, comprehensiveExample }

// Run examples if this file is executed directly
if (require.main === module) {
  console.log("Running BaaS client examples...")
  exampleUsage()
    .then(() => {
      console.log("Basic example completed")
      return exampleWithErrorHandling()
    })
    .then(() => {
      console.log("Error handling example completed")
      return calendarExample()
    })
    .then(() => {
      console.log("Calendar example completed")
      return advancedUsage()
    })
    .then(() => {
      console.log("Advanced example completed")
      return comprehensiveExample()
    })
    .then(() => {
      console.log("Comprehensive example completed")
    })
    .catch((error) => {
      console.error("Example failed:", error)
    })
}

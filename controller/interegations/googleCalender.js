// Fixed Google Calendar Controller
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Helper function to format datetime
const formatDateTime = (dateTimeString, timeZone = "Asia/Kolkata") => {
  // If the datetime doesn't include seconds, add them
  if (dateTimeString && !dateTimeString.includes(':')) {
    // Handle case where only date is provided
    dateTimeString += 'T00:00:00';
  } else if (dateTimeString && dateTimeString.split('T')[1] && dateTimeString.split('T')[1].split(':').length === 2) {
    // Add seconds if not present
    dateTimeString += ':00';
  }
  
  return dateTimeString;
};

// Generate Auth URL
export const authSetup = (req, res) => {
  try {
    const frontendRedirect = req.query.redirect;
    
    if (!frontendRedirect) {
      return res.status(400).json({ error: "Redirect URL is required" });
    }

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ],
      state: Buffer.from(frontendRedirect).toString('base64'),
    });

    res.redirect(url);
  } catch (error) {
    console.error("Auth setup error:", error);
    res.status(500).json({ error: "Failed to setup authentication" });
  }
};

// Handle callback
export const authRedirect = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const error = req.query.error;
  
  if (error) {
    const originalUrl = state ? Buffer.from(state, 'base64').toString() : 'http://localhost:5173/';
    return res.redirect(`${originalUrl}?google_auth_error=true&error_message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    const originalUrl = state ? Buffer.from(state, 'base64').toString() : 'http://localhost:5173/';
    return res.redirect(`${originalUrl}?google_auth_error=true&error_message=No authorization code`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    const originalUrl = state ? Buffer.from(state, 'base64').toString() : 'http://localhost:5173/';
    const url = new URL(originalUrl);
    
    url.searchParams.set('email', data.email);
    url.searchParams.set('token', Buffer.from(JSON.stringify(tokens)).toString('base64'));
    url.searchParams.set('google_auth_success', 'true');

    return res.redirect(url.toString());
  } catch (error) {
    console.error("OAuth Error:", error);
    const originalUrl = state ? Buffer.from(state, 'base64').toString() : 'http://localhost:5173/';
    return res.redirect(`${originalUrl}?google_auth_error=true&error_message=${encodeURIComponent(error.message)}`);
  }
};

// Create calendar event with enhanced error handling
export const createCalendarEvent = async (req, res) => {
    const { event, tokens } = req.body;
    
    console.log("📅 Received event creation request:");
    console.log("Event data:", JSON.stringify(event, null, 2));
    console.log("Tokens present:", !!tokens);
    
    if (!tokens || !event) {
        return res.status(400).json({ error: "Missing event data or tokens" });
    }

    try {
        // Set credentials
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // Fix datetime format
        const formattedEvent = {
            ...event,
            start: {
                ...event.start,
                dateTime: formatDateTime(event.start.dateTime)
            },
            end: {
                ...event.end,
                dateTime: formatDateTime(event.end.dateTime)
            }
        };

        // Add conferenceData for Google Meet
        formattedEvent.conferenceData = {
            createRequest: {
                requestId: Math.random().toString(36).substring(2),
                conferenceSolutionKey: { type: "hangoutsMeet" },
            },
        };

        console.log("📝 Formatted event data:", JSON.stringify(formattedEvent, null, 2));

        // Create the event
        const response = await calendar.events.insert({
            calendarId: "primary",
            resource: formattedEvent,
            conferenceDataVersion: 1,
            sendUpdates: 'all' // Send invitations to attendees
        });

        console.log("✅ Event created successfully:", response.data.id);
        console.log("🔗 Meet link:", response.data.hangoutLink);

        res.json({ 
            success: true, 
            data: response.data,
            meetLink: response.data.hangoutLink
        });

    } catch (error) {
        console.error("❌ Event Creation Error:");
        console.error("Error message:", error.message);
        console.error("Error details:", error.response?.data);
        console.error("Full error:", error);
        
        // Handle specific Google API errors
        if (error.code === 401) {
            res.status(401).json({ 
                error: "Authentication failed", 
                details: "Please re-authenticate with Google",
                code: error.code
            });
        } else if (error.code === 400) {
            res.status(400).json({ 
                error: "Invalid event data", 
                details: error.message,
                specificError: error.response?.data?.error?.message || "Bad Request",
                code: error.code
            });
        } else if (error.code === 403) {
            res.status(403).json({ 
                error: "Permission denied", 
                details: "Insufficient permissions to create calendar events",
                code: error.code
            });
        } else {
            res.status(500).json({ 
                error: "Failed to create event", 
                details: error.message,
                specificError: error.response?.data?.error?.message,
                code: error.code
            });
        }
    }
};

// Fetch calendar events
export const fetchCalendarEvents = async (req, res) => {
    const { tokens } = req.body;

    if (!tokens) {
        return res.status(400).json({ error: "Tokens required" });
    }

    try {
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: "startTime",
        });

        res.json(response.data.items || []);
    } catch (error) {
        console.error("Calendar Error:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
};

// Delete calendar event
export const deleteCalendarEvent = async (req, res) => {
    const { tokens } = req.body;
    const eventId = req.params.id;
    
    if (!tokens || !eventId) {
        return res.status(400).json({ error: "Missing event ID or tokens" });
    }

    try {
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        await calendar.events.delete({
            calendarId: "primary",
            eventId,
        });

        res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Event Deletion Error:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
};

// Test endpoint for debugging
export const testCalendarAccess = async (req, res) => {
    const { tokens } = req.body;

    if (!tokens) {
        return res.status(400).json({ error: "Tokens required" });
    }

    try {
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // Test basic calendar access
        const calendars = await calendar.calendarList.list();
        
        res.json({ 
            success: true, 
            message: "Calendar access successful",
            calendars: calendars.data.items.map(cal => ({
                id: cal.id,
                summary: cal.summary, 
                primary: cal.primary
            }))
        });

    } catch (error) {
        console.error("Calendar Access Test Error:", error);
        res.status(500).json({ 
            error: "Failed to access calendar", 
            details: error.message,
            code: error.code
        });
    }
};
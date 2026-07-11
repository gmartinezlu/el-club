const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function buildGoogleAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: opts.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

export async function exchangeCodeForTokens(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<GoogleTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      code: opts.code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }
  return response.json();
}

export async function refreshAccessToken(opts: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<GoogleTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      refresh_token: opts.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${await response.text()}`);
  }
  return response.json();
}

export async function fetchGoogleEmail(accessToken: string): Promise<string> {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Google userinfo request failed: ${await response.text()}`);
  }
  const data = (await response.json()) as { email?: string };
  if (!data.email) throw new Error("Google userinfo response missing email");
  return data.email;
}

export type CreateEventInput = {
  accessToken: string;
  calendarId: string;
  summary: string;
  description?: string;
  startIso: string;
  endIso: string;
  attendeeEmail: string;
};

export type CreateEventResult = {
  eventId: string;
  meetUrl: string | null;
};

export async function createCalendarEventWithMeet(
  input: CreateEventInput,
): Promise<CreateEventResult> {
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events` +
    `?conferenceDataVersion=1&sendUpdates=all`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startIso },
      end: { dateTime: input.endIso },
      attendees: [{ email: input.attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Calendar event creation failed: ${await response.text()}`);
  }

  const event = (await response.json()) as {
    id: string;
    hangoutLink?: string;
  };
  return { eventId: event.id, meetUrl: event.hangoutLink ?? null };
}

export async function deleteCalendarEvent(opts: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}): Promise<void> {
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(opts.calendarId)}/events/${opts.eventId}` +
    `?sendUpdates=all`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${opts.accessToken}` },
  });

  // 410 Gone means it was already deleted on Google's side — treat as success.
  if (!response.ok && response.status !== 410 && response.status !== 404) {
    throw new Error(`Google Calendar event deletion failed: ${await response.text()}`);
  }
}

export function getGoogleCalendarUrl(interview) {
  try {
    const startDate = new Date(interview.interview_time);
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
    const formatGCal = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const startStr = formatGCal(startDate);
    const endStr = formatGCal(endDate);
    const title = `Interview: ${interview.round} (${interview.job_title || 'Role'})`;
    const details = `TalentFlow Interview Session\nCandidate: ${interview.candidate_name || 'Candidate'}\nRole: ${interview.job_title || 'Job Opening'}\nRound: ${interview.round}\nMeeting Link: ${interview.meeting_link || 'Online'}\nOrganized via TalentFlow ATS`;
    const location = interview.meeting_link || interview.mode || 'Online Video';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  } catch (e) {
    return '#';
  }
}

export function downloadIcsFile(interview) {
  try {
    const startDate = new Date(interview.interview_time);
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
    const formatIcs = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TalentFlow//ATS Interview System//EN',
      'BEGIN:VEVENT',
      `UID:${interview.id}-${Date.now()}@talentflow.local`,
      `DTSTAMP:${formatIcs(new Date())}`,
      `DTSTART:${formatIcs(startDate)}`,
      `DTEND:${formatIcs(endDate)}`,
      `SUMMARY:Interview: ${interview.round} - ${interview.job_title || 'TalentFlow'}`,
      `DESCRIPTION:Interview with ${interview.candidate_name || 'Candidate'}\\nMeeting Link: ${interview.meeting_link || 'Online'}`,
      `LOCATION:${interview.meeting_link || interview.mode || 'Online'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interview-${(interview.round || 'session').toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('ICS export error:', e);
  }
}

export function formatRelativeInterviewTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isSameDay = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isSameDay) {
    if (diffMs > 0) {
      const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return mins < 60 ? `Starts in ${mins}m (${timeStr})` : `Today at ${timeStr}`;
    }
    return `Today at ${timeStr}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  }
  if (diffMs > 0 && diffDays <= 7) {
    const dayName = date.toLocaleDateString([], { weekday: 'short' });
    return `${dayName} at ${timeStr} (in ${diffDays}d)`;
  }
  if (diffMs < 0) {
    return `Past (${date.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ` at ${timeStr}`;
}

export function formatDate(date: Date): string {
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date object");
    }

    // Options for formatting
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}
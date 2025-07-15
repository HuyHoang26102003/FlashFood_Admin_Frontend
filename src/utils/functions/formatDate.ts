export function formatDate(date: Date): string {
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date object");
    }

    // Options for formatting
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

export function formatEpochToDate(epoch: number): string {
    if (typeof epoch !== "number" || isNaN(epoch)) {
        throw new Error("Invalid epoch timestamp");
    }
    const date = new Date(epoch);
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date derived from epoch");
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

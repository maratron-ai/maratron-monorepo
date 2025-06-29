// Updated helper function to calculate pace (mm:ss per unit) using HH:MM:SS input
const calculatePace = (duration: string, distance: number): string => {
  const [hours, minutes, seconds] = duration.split(":").map(Number);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const paceSeconds = totalSeconds / distance;
  const paceMinutes = Math.floor(paceSeconds / 60);
  const remainingSeconds = Math.round(paceSeconds % 60);
  return `${paceMinutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

export default calculatePace;
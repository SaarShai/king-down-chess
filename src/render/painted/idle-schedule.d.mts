export function idleSchedule(random?: () => number): {
 update(time: number, pieces: Map<number, number>, duration: (key: number) => number, enabled?: boolean): Map<number, number>;
};

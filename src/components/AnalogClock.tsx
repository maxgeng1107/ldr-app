import { clockAngles, formatTime } from "@/lib/time";
import SVG, { Circle, Line, Text } from "react-native-svg";

// Numbers sit on an inner circle. Text must stay upright, so instead of rotating it,
// compute its position: angle θ clockwise from 12 → x = cx + r·sin θ, y = cy − r·cos θ.
const NUMBER_RADIUS = 67;
const NUMBER_SIZE = 12;
function numberPosition(i: number) {
    const theta = (i * 30 * Math.PI) / 180;           // degrees → radians
    return {
        x: 100 + NUMBER_RADIUS * Math.sin(theta),
        y: 100 - NUMBER_RADIUS * Math.cos(theta) + NUMBER_SIZE * 0.35,   // shift down to center the glyph vertically
    };
}

export function AnalogClock({timeZone, now, size = 120} : {timeZone:string, now:Date, size?:number}){
    const { hour, minute, second } = clockAngles(timeZone, now);
    return (
        <SVG width={size} height={size} viewBox="0 0 200 200">
            {/* 12 hour marks: rotate the same short line by i * 30°; 12/3/6/9 longer and thicker */}
            {Array.from({ length: 12 }, (_, i) => (
                <Line key={i} x1={100} y1={10} x2={100} y2={i % 3 === 0 ? 17 : 15}
                    stroke="black" strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round"
                    transform={`rotate(${i * 30} 100 100)`} />
            ))}
            {/* numbers 12, 1, 2 … 11, upright */}
            {Array.from({ length: 12 }, (_, i) => {
                const { x, y } = numberPosition(i);
                return (
                    <Text key={`n${i}`} x={x} y={y} textAnchor="middle"
                        fontSize={NUMBER_SIZE} fontWeight="200" fill="black">
                        {i === 0 ? 12 : i}
                    </Text>
                );
            })}
            <Line x1={100} y1={100} x2={100} y2={58}
                stroke="black" strokeWidth={3} strokeLinecap="round"
                transform={`rotate(${hour} 100 100)`}/>
            <Line x1={100} y1={100} x2={100} y2={30}
                stroke="black" strokeWidth={2} strokeLinecap="round"
                transform={`rotate(${minute} 100 100)`}/>
            <Line x1={100} y1={100} x2={100} y2={24}
                stroke="red" strokeWidth={1} strokeLinecap="round"
                transform={`rotate(${second} 100 100)`} />
            <Circle cx={100} cy={100} r={1} fill="black" />
            <Text x={100} y={125} textAnchor="middle" fontSize={10}>
                {formatTime(timeZone,now,false)}
            </Text>
        </SVG>
    );
}

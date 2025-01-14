import { ChalkInstance } from "chalk";

export default function buildMultilineOutput() {
    let output = '';

    const append = (value?: string | { label: string, message: string }, colorFn?: ChalkInstance) => {
        if (value) {
            if (!colorFn) {
                if (typeof value === 'string') {
                    output += value + '\n\n';
                } else {
                    output += value.label + ": " + value.message + '\n\n';
                }
                return;
            }
            if (typeof value === 'string') {
                output += colorFn(value) + '\n\n';
            } else {
                output += colorFn(value.label + ': ') + value.message + '\n\n';
            }
        }
    };

    const getOutput = () => output;

    return { getOutput, append }
}
export default interface Logs {
    id: number;
    query: string;
    keywords: string;
    timestamp: Date;
    page_number: number;
    board: 'lever' | 'greenhouse' | 'workable' | 'join'
}
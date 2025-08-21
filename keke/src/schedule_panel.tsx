import { Stack, Paper, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useEffect, useState } from 'react';
import { keckAPIURL } from './config';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { StyledPaper } from './App';


interface ScheduleTableProps {
    schedule: ScheduleItem[]
    instrumentStatusResp: InstrumentStatusResponse;
}

export const ScheduleTable = ({ schedule, instrumentStatusResp }: ScheduleTableProps) => {
    return (
        <Grid container spacing={12} justifyContent="center">
            <Grid size={4} justifyContent='center'>
                <Typography variant="h6" align="center">Schedule</Typography>
                <TableContainer sx={{ maxWidth: 651, justifyContent: 'center' }} component={Paper}>
                    <Table sx={{ maxWidth: 650, justifyContent: 'center' }} size='small' aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Instrument</TableCell>
                                <TableCell align="right">Start Time - End Time</TableCell>
                                <TableCell>Institution</TableCell>
                                <TableCell align="right">PI</TableCell>
                                <TableCell align="right">Telescope</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {schedule.map((row) => (
                                <TableRow
                                    key={row.SchedId}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.Instrument}
                                    </TableCell>
                                    <TableCell align="right">{row.StartTime + ' - ' + row.EndTime}</TableCell>
                                    <TableCell align="right">{row.Institution}</TableCell>
                                    <TableCell align="right">{row.Principal}</TableCell>
                                    <TableCell align="right">{row.TelNr}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
            <Grid size={4} justifyContent='center'>
                <Typography variant="h6" align="center">Instrument ToO Readiness</Typography>
                <TableContainer sx={{ maxWidth: 1000, justifyContent: 'center' }} component={Paper}>
                    <Table sx={{ maxWidth: 1000, justifyContent: 'center' }} size='small' aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell align="right">Too Ready?</TableCell>
                                <TableCell align="right">Instrument?</TableCell>
                                <TableCell>Telescope</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(instrumentStatusResp)
                                .sort(([, a], [, b]) => {
                                    if (a.TooReady && !b.TooReady) {
                                        return -1; // a comes before b
                                    }
                                    if (!a.TooReady && b.TooReady) {
                                        return 1; // b comes before a
                                    }
                                    return 0; // keep original order if both are the same
                                })
                                .map(([key, row]) => (
                                    <TableRow
                                        key={key}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.TooReady ? 'Yes' : 'No'}
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            {key}
                                        </TableCell>
                                        <TableCell align="right">{row.TelNr}</TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Grid>
    );
}

export const DayjsDatePicker = ({ date, setDate }: { date: Dayjs, setDate: (date: Dayjs) => void }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label="Observing Date (HT)"
                value={date} 
                onChange={(newValue) => newValue && setDate(newValue)} />
        </LocalizationProvider>
    );
}

export interface Props {
    date: Dayjs;
    setDate: (date: Dayjs) => void;
    schedule: ScheduleItem[];
    setSchedule: (schedule: ScheduleItem[]) => void;
}

export interface ScheduleItem {
    SchedId: number;
    Date: string;
    StartTime: string;
    EndTime: string;
    Instrument: string;
    Account: string;
    ProjCode: string;
    Institution: string;
    Principal: string;
    Observers: string;
    Location: string;
    Obsid: string;
    Length: number;
    FractionOfNight: number;
    Semester: string;
    TelNr?: string;
}

interface Instrument {
    Instrument: string;
    ScienceLocation: string;
    StorageLocation: string;
    TelNr: string;
}

interface InstrumentStatus {
    Instrument: string;
    Available?: number;
    Date?: string;
    Location?: string;
    Scheduled?: number;
    Status?: string;
    TelNr?: number;
    TooReady?: boolean;
}

export interface InstrumentStatusResponse {
    [key: string]: InstrumentStatus;
}

export const SchedulePanel = (props: Props) => {
    const { date, setDate, schedule, setSchedule } = props;
    const [instrumentsStatusResp, setInstrumentsStatusResp] = useState<InstrumentStatusResponse>({});

    useEffect(() => {

        const getSchedule = async () => {
            console.log('TooForm component mounted with date:', date);
            let sched = [] as ScheduleItem[];
            try {
                for (let idx = 1; idx <= 2; idx++) {
                    const telnr = idx.toString();
                    const dateString = date.format('YYYY-MM-DD');
                    const response = await fetch(`${keckAPIURL}/schedule/getSchedule?date=${dateString}&telnr=${telnr}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    let tsched = await response.json() as ScheduleItem[];
                    tsched = tsched.map(item => ({
                        ...item,
                        TelNr: telnr
                    }));

                    sched = [...sched, ...tsched];
                }
                setSchedule(sched);
            } catch (error) {
                console.error('Failed to fetch schedule:', error);
            }

            try {
                const response2 = await fetch(`${keckAPIURL}/too/getInstrumentsTooStatus?date=${date.format('YYYY-MM-DD')}`);
                if (!response2.ok) {
                    throw new Error('Network response was not ok');
                }
                let instrStatus = await response2.json() as InstrumentStatusResponse;
                instrStatus = Object.fromEntries(Object.entries(instrStatus).filter(([_, status]) => status.Instrument !== null
                ));

                setInstrumentsStatusResp(instrStatus);
            } catch (error) {
                console.error('Failed to fetch instruments:', error);
            }

        }
        console.log('Fetching schedule for date:', date.format('YYYY-MM-DD'));
        getSchedule();

    }, [date])

    return (
        <Stack sx={{
            paddingTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
        }}
            justifyContent='center'
            maxWidth='100%'
        >
            <StyledPaper>
                <Box>
                    <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <DayjsDatePicker
                            date={date}
                            setDate={setDate}
                        />
                    </Stack>
                    <ScheduleTable schedule={schedule} instrumentStatusResp={instrumentsStatusResp} />
                </Box>
            </StyledPaper>
        </Stack>
    )
}
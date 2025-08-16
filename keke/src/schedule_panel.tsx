import { Tooltip, TextField, Stack, Paper, Box, Typography } from '@mui/material';
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


interface ScheduleTableProps {
    schedule: ScheduleItem[]
    instrumentStatus: InstrumentStatus[];
}

export const ScheduleTable = ({ schedule, instrumentStatus }: ScheduleTableProps) => {
    return (
        <Grid container justifyContent="center">
            <Grid item>
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
            <Grid item>
                <TableContainer sx={{ maxWidth: 1000, justifyContent: 'center' }} component={Paper}>
                    <Table sx={{ maxWidth: 1000, justifyContent: 'center' }} size='small' aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell align="right">Too Ready?</TableCell>
                                <TableCell align="right">Instrument?</TableCell>
                                <TableCell>Telescope</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Available</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {instrumentStatus.map((row) => (
                                <TableRow
                                    key={row.Instrument}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.TooReady ? 'Yes' : 'No'}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {row.Instrument}
                                    </TableCell>
                                    <TableCell align="right">{row.TelNr}</TableCell>
                                    <TableCell align="right">{row.Status}</TableCell>
                                    <TableCell align="right">{row.Available}</TableCell>
                                </TableRow>
                            ))}
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
            <DatePicker label="Basic date picker" value={date} onChange={(newValue) => newValue && setDate(newValue)} />
        </LocalizationProvider>
    );
}

export interface Props {
    date: Dayjs;
    setDate: (date: Dayjs) => void;
}

interface ScheduleItem {
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

interface InstrumentStatusResponse {
    [key: string]: InstrumentStatus;
}

export const SchedulePanel = (props: Props) => {
    const { date, setDate } = props;
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [instrumentsStatus, setInstrumentsStatus] = useState<InstrumentStatus[]>([]);

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
                const response = await fetch(`${keckAPIURL}/schedule/getActiveInstruments`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const instr = await response.json() as Instrument[];
                const instrString = instr.map(instr => instr.Instrument).join(',');
                const response2 = await fetch(`${keckAPIURL}/too/getInstrumentsTooStatus?date=${date.format('YYYY-MM-DD')}&instruments=${instrString}`);
                if (!response2.ok) {
                    throw new Error('Network response was not ok');
                }
                const instrStatus = await response2.json() as InstrumentStatusResponse;
                setInstrumentsStatus(Object.values(instrStatus).filter(status => status.Instrument !== null));
            } catch (error) {
                console.error('Failed to fetch instruments:', error);
            }

        }
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
            <Paper
                sx={{
                    padding: '12px',
                    margin: '6px',
                }}
                elevation={3}
            >
                <Box>
                    <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <DayjsDatePicker
                            date={date}
                            setDate={setDate}
                        />
                    </Stack>
                    <ScheduleTable schedule={schedule} instrumentStatus={instrumentsStatus} />
                </Box>
            </Paper>
        </Stack>
    )
}
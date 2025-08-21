import { Tooltip, TextField, Stack, Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { StyledPaper } from './App';
import { useEffect, useState } from 'react';
import { keckAPIURL } from './config';
import type { ScheduleItem } from './schedule_panel';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import dayjs from 'dayjs';

interface StartTimePickerProps {
    time: string;
    date: dayjs.Dayjs;
    setTime: (time: string) => void;
}

export default function StartTimePicker({ date, time, setTime }: StartTimePickerProps) {
    const [hour, minute] = time ? time.split(':').map(Number) : [0, 0];
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimeField label="Observing Start Time (HT)"
                value={date.set('hour', hour).set('minute', minute)}
                format="HH:mm"
                onChange={(newValue) => newValue && setTime(newValue.format('HH:mm:ss'))} />
        </LocalizationProvider>
    );
}

export interface Props {
    semester: string;
    obsid: string;
    schedule: ScheduleItem[];
    date: any;
    userinfo: any;
}

type ActionType = 'draft' | 'submit' | 'edit';
type InterruptType = 'partner' | 'institution';

const INTERRUPT_TYPES: InterruptType[] = ['partner', 'institution'];
const FLEXIBILITY_OPTIONS: string[] = ['+/- 0:00:00', '+/- 1:00:00', '+/- 2:00:00', '+/- 3:00:00', '+/- 4:00:00'];
const OBSERVER_LOCATIONS: string[] = ['Remote', 'HQ'];

export interface TooItem {
    FirstName: string;
    LastName: string;
    HoursChargedInstitution: number;
    HoursChargedPartner: number;
    HoursRemainInstitution: number;
    HoursRemainPartner: number;
    InstrumentList: string;
    InterruptList: string;
    ObsId: string;
    ProjCode: string;
    Semester: string;
    tooHoursInstitution: number;
    tooHoursPartner: number;
}

export interface Too {
    submitterid: string;
    username: string;
    action: ActionType;
    tooid?: string;
    delFlag: boolean
    semester: string;
    piid: string;
    projcode: string;
    instrument: string;
    obsdate: string;
    starttime: string;
    duration: string;
    target: string;
    flextime: string;
    obsdesignation?: string;
    obslocation: string;
    pinotes?: string;
    interruptproj: string;
    interrupttype: InterruptType;
    skipsubmitwarnings?: number;
    instrconfigs?: string;
}

interface TooInterruptResult {
    checkTimeHST: string
    InstrReadyWarn: boolean
    InstrState: string
    TelReayWarn: boolean
    TelState: string
    canInterrupt: boolean;
    errors: boolean;
    programs: object[]
}

export const TooForm = (props: Props) => {
    const { semester, obsid, schedule, date, userinfo } = props;
    const [toos, setToos] = useState<TooItem[]>([]);
    const [tooRequests, setTooRequests] = useState<Too[]>([]);
    const [selectedTooItem, setSelectedTooItem] = useState<TooItem | null>(null);
    const [result, setResult] = useState<TooInterruptResult | null>(null);

    const [too, setToo] = useState<Too>({ duration: '1:00:00' } as Too)
    const [tooSavedTrigger, setTooSavedTrigger] = useState(0);

    useEffect(() => {
        setToo((prevToo) => {
            return ({
                ...prevToo,
                semester: semester,
                obsdate: date.format('YYYY-MM-DD'),
                starttime: dayjs().format('HH:mm:ss'),
                submitterid: obsid,
                username: userinfo?.username || '',
                action: 'draft'
            });
        }); // Initialize too with default values
    }, [selectedTooItem, date, userinfo]);

    const get_too_requests = async () => {
        try {
            const response = await fetch(`${keckAPIURL}/too/getObserverToos?semester=${semester}&obsid=${obsid}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json()
            if (Array.isArray(data)) {
                console.log('Fetched ToO Requests:', data);
                setTooRequests(data);
            }
        } catch (error) {
            console.error('Error fetching TOOs:', error);
        }
    }

    useEffect(() => {
        const fetchToos = async () => {
            console.log('TooForm component mounted with target:');
            try {
                const response = await fetch(`${keckAPIURL}/too/getToo?semester=${semester}&obsid=${obsid}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                console.log('Fetched ToO Line Items:', data);
                setToos(data);
                setSelectedTooItem(data.length > 0 ? data[0] : null);
            } catch (error) {
                console.error('Error fetching TOOs:', error);
            }
            get_too_requests();

        };
        fetchToos();
    }, [semester, obsid]);

    useEffect(() => {
        get_too_requests();
    }, [tooSavedTrigger]);


    const call_too_can_interrupt = async (too: Too) => {
        console.log('Calling too_can_interrupt with:', too);
        try {
            const params = new URLSearchParams(
                {
                    semester,
                    obsid: userinfo.Id,
                    instr: too.instrument,
                    date: too.obsdate,
                    duration: too.duration,
                    starttime: too.starttime,
                }
            ).toString()
            const response = await fetch(`${keckAPIURL}/too/getTooCanInterrupt?${params}`, {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const res = await response.json();
            console.log('Response from can_interrupt:', res);
            setResult(res)
        } catch (error) {
            console.error('Error in can_interrupt:', error);
        }
    }

    const call_save_too = async (action: string) => {
        action = action === 'draft' && too.tooid ? 'edit' : 'draft'
        console.log('Saving ToO request with the following details:');
        console.log('too:', too, 'action:', action);
        const resp = await fetch(`${keckAPIURL}/too/submitTooRequest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...too, 'action': action }),

        });
        if (!resp.ok) {
            throw new Error('Failed to save ToO request');
        }
        setTooSavedTrigger(prev => prev + 1);
        console.log('ToO request saved successfully.');
    }

    const call_too_cancel = async (too: Too) => {
        console.log('Cancelling ToO request with the following details:');
        const cancelRequest = { 'tooid': too.tooid ?? '', 'approvalnotes': 'cancelled via online interface' };
        const params = new URLSearchParams(
            cancelRequest
        ).toString()
        const resp = await fetch(`${keckAPIURL}/too/submitTooCancel?${params}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!resp.ok) {
            throw new Error('Failed to save ToO request');
        }
        console.log('ToO request saved successfully.');
    }

    console.log('TooForm component mounted with toos:', toos);
    const projCodes = toos.map(too => too.ProjCode);

    return (
        <Stack sx={{
            paddingTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
        }}
            justifyContent='center'
            maxWidth='100%'
        >
            <StyledPaper
            >
                <Box>
                    <Stack sx={{ marginBottom: '24px' }} width="100%" direction="column" justifyContent='center' spacing={2}>
                        <Tooltip title={'select existing ToO Request to edit/view'}>
                            <FormControl fullWidth sx={{ width: 150, alignSelf: "center" }}>
                                <InputLabel id="select-too-request">Program ID</InputLabel>
                                <Select
                                    labelId="select-too-request"
                                    id="select-too-request"
                                    required
                                    value={too?.tooid + '-' + too?.target || 'You have no Programs Available'}
                                    label="Program Id"
                                    onChange={(event) => {
                                        console.log('Selected value:', event.target.value);
                                        const tooReq = tooRequests.find(too => too.projcode === event.target.value);
                                        if (tooReq) {
                                            setToo(tooReq)
                                        }
                                    }}
                                >
                                    {tooRequests && tooRequests.map(too => (
                                        <MenuItem key={too.tooid} value={too.tooid}>{too.tooid + '-' + too.target}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Tooltip>
                        <Tooltip title={'select ToO program id'}>
                            <FormControl fullWidth sx={{ width: 150, alignSelf: "center" }}>
                                <InputLabel id="select-program-id">Program ID</InputLabel>
                                <Select
                                    labelId="select-program-id"
                                    id="select-program-id"
                                    required
                                    value={selectedTooItem?.ProjCode || 'You have no Programs Available'}
                                    label="Program Id"
                                    onChange={(event) => {
                                        console.log('Selected value:', event.target.value);
                                        const tooItem = toos.find(too => too.ProjCode === event.target.value);
                                        if (tooItem) {
                                            setSelectedTooItem(tooItem)
                                        }
                                    }}
                                >
                                    {projCodes.map(code => (
                                        <MenuItem key={code} value={code}>{code}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Tooltip>
                        <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                            {`Remaining Institution Hours: ${selectedTooItem?.HoursRemainInstitution || '0'}`}
                        </Typography>
                        <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                            {`Remaining Partner Hours: ${selectedTooItem?.HoursRemainPartner || '0'}`}
                        </Typography>
                        <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                            {`Can Interrupt Institutions: ${selectedTooItem?.InterruptList || 'No ToO Program selected'}`}
                        </Typography>
                        <Tooltip title={'select Interrupt type'}>
                            <FormControl fullWidth sx={{ width: 250, alignSelf: "center" }}>
                                <InputLabel id="interrupt-type">Interrupt type</InputLabel>
                                <Select
                                    labelId="select-interrupt-type"
                                    id="select-interrupt-type"
                                    value={too.interrupttype}
                                    required
                                    label="Interrupt Type"
                                    onChange={(evt) => {
                                        setToo(prevToo => ({
                                            ...prevToo,
                                            interrupttype: evt.target.value,
                                        }));
                                    }}
                                >
                                    {INTERRUPT_TYPES.map(it => (
                                        <MenuItem key={it} value={it}>{it}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Tooltip>
                        <Tooltip title={'select Instrument'}>
                            <FormControl fullWidth sx={{ width: 250, alignSelf: "center" }}>
                                <InputLabel id="select-instrument">Instrument</InputLabel>
                                <Select
                                    labelId="select-instrument"
                                    id="select-instrument"
                                    value={too.instrument}
                                    required
                                    label="Instrument"
                                    onChange={(evt) => {
                                        setToo(prevToo => ({
                                            ...prevToo,
                                            instrument: evt.target.value,
                                        }));
                                    }}
                                >
                                    {selectedTooItem?.InstrumentList.split(',').map(inst => (
                                        <MenuItem key={inst} value={inst}>{inst}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Tooltip>
                        <Tooltip title={'Select Interrupted Program'}>
                            <FormControl fullWidth sx={{ width: 250, alignSelf: "center" }}>
                                <InputLabel id="interrupted-program">Interrupted Program</InputLabel>
                                <Select
                                    labelId="select-interrupted-program"
                                    id="select-interrupted-program"
                                    required
                                    value={too?.interruptproj}
                                    label="Interrupted Program"
                                    onChange={(evt) => {
                                        setToo(prevToo => ({
                                            ...prevToo,
                                            interruptproj: evt.target.value,
                                        }));
                                    }}
                                >
                                    {schedule.map(ol => (
                                        <MenuItem key={ol.ProjCode} value={ol.ProjCode}>{ol.ProjCode}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Tooltip>
                        <Tooltip title={'Select Flexibility'}>
                            <FormControl fullWidth sx={{ width: 250, alignSelf: "center" }}>
                                <InputLabel id="flex-time">Flexibility</InputLabel>
                                <Select
                                    labelId="select-flex-time"
                                    id="select-flex-time"
                                    value={too.flextime}
                                    label="Flexibility"
                                    onChange={(evt) => {
                                        setToo(prevToo => ({
                                            ...prevToo,
                                            flextime: evt.target.value,
                                        }));
                                    }}
                                >
                                    {FLEXIBILITY_OPTIONS.map(fo => (
                                        <MenuItem key={fo} value={fo}>{fo}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Tooltip>
                        <Tooltip title={'Select Observer Location'}>
                            <FormControl fullWidth sx={{ width: 250, alignSelf: "center" }}>
                                <InputLabel id="observer-location">Observer Location</InputLabel>
                                <Select
                                    labelId="select-observer-location"
                                    id="select-observer-location"
                                    value={too.obslocation}
                                    label="Observer Location"
                                    onChange={(evt) => {
                                        setToo(prevToo => ({
                                            ...prevToo,
                                            obslocation: evt.target.value,
                                        }));
                                    }}
                                >
                                    {OBSERVER_LOCATIONS.map(ol => (
                                        <MenuItem key={ol} value={ol}>{ol}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Tooltip>
                        <TextField sx={{ width: 250, alignSelf: "center" }} label="Duration" value={too.duration} />
                        <Tooltip title={'Include any notes'}>
                            <FormControl fullWidth sx={{ width: 250, alignSelf: "center" }}>
                                <TextField
                                    id="notes"
                                    label="Notes"
                                    placeholder="Enter any notes here"
                                    multiline
                                    variant="outlined"
                                    onChange={(evt) => {
                                        setToo(prevToo => ({
                                            ...prevToo,
                                            pinotes: evt.target.value,
                                        }));
                                    }}
                                />
                            </FormControl>
                        </Tooltip>
                        <TextField sx={{ width: 250, alignSelf: "center" }} label="Duration" value={too.duration} />
                    </Stack>
                    <StartTimePicker date={date} time={too.starttime} setTime={(time) => setToo(prevToo => ({ ...prevToo, starttime: time }))} />
                    <Stack direction="row" justifyContent="center" spacing={2} sx={{ paddingBottom: '16px' }}>
                        <Tooltip title={'Save ToO request draft'}>
                            <Button
                                variant="contained"
                                onClick={() => call_save_too('draft')}
                                disabled={!too.instrument || !too.obsdate || !too.starttime || !too.duration || !too.interruptproj || !too.interrupttype}
                            >
                                Save ToO Request
                            </Button>
                        </Tooltip>
                        <Tooltip title={'Submit ToO request'}>
                            <Button
                                variant="contained"
                                onClick={() => call_save_too('submit')}
                                disabled={!too.instrument || !too.obsdate || !too.starttime || !too.duration || !too.interruptproj || !too.interrupttype}
                            >
                                Submit ToO Request
                            </Button>
                        </Tooltip>
                        <Tooltip title={'Cancel ToO request'}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    call_too_cancel(too);
                                }}
                                disabled={!too.tooid}
                            >
                                Cancel ToO Request
                            </Button>
                        </Tooltip>
                        <Tooltip title={'Validate ToO request'}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    call_too_can_interrupt(too);
                                }}
                            >
                                Validate ToO Request
                            </Button>
                        </Tooltip>
                        {result && !result.canInterrupt && (
                            <Tooltip title={'ToO cannot be interrupted'}>
                                <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                                    ToO Cannot be Interrupted
                                </Typography>
                            </Tooltip>
                        )}
                    </Stack>
                </Box>
            </StyledPaper>
        </Stack >
    )
}
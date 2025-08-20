import { Tooltip, TextField, Stack, Box, Autocomplete, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { StyledPaper } from './App';
import { useEffect, useState } from 'react';
import { keckAPIURL } from './config';

export interface Props {
    semester: string;
    obsid: string;
}

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

type ActionType = 'draft' | 'submit' | 'edit';
type InterruptType = 'partner' | 'institution';

export interface Too {
    submitterid: string;
    username: string;
    action: ActionType;
    tooid?: string;
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

export const TooForm = (props: Props) => {
    const { semester, obsid } = props;
    const [toos, setToos] = useState<TooItem[]>([]);
    const [selectedTooItem, setSelectedTooItem] = useState<TooItem | null>(null);
    const [instrument, setInstrument] = useState<string | null>(null);
    const [too, setToo] = useState<Too | null>(null)

    useEffect(() => {
        const fetchToos = async () => {
            console.log('TooForm component mounted with target:');
            try {
                const response = await fetch(`${keckAPIURL}/too/getToo?semester=${semester}&obsid=${obsid}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                console.log('Fetched TOOs:', data);
                setToos(data);
                setSelectedTooItem(data.length > 0 ? data[0] : null);
            } catch (error) {
                console.error('Error fetching TOOs:', error);
            }
        };
        fetchToos();
    }, [semester, obsid]);

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
                        <Tooltip title={'select ToO program id'}>
                        <FormControl fullWidth sx={{ width: 150, alignSelf: "center" }}>
                            <InputLabel id="select-program-id">Program ID</InputLabel>
                            <Select
                                labelId="select-program-id"
                                id="select-program-id"
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
                        <Tooltip title={'select ToO approved instrument'}>
                        <FormControl fullWidth sx={{ width: 250, alignSelf: "center" }}>
                            <InputLabel id="select-instrument">Instrument</InputLabel>
                            <Select
                                labelId="select-instrument"
                                id="select-instrument"
                                value={instrument || ''}
                                label="Instrument"
                                onChange={(evt) => {
                                    setInstrument(evt.target.value);
                                }}
                            >
                                {selectedTooItem?.InstrumentList.split(',').map(inst => (
                                    <MenuItem key={inst} value={inst}>{inst}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        </Tooltip>
                    </Stack>
                </Box>
            </StyledPaper>
        </Stack >
    )
}
import { Tooltip, TextField, Stack, Paper, Box } from '@mui/material';

export interface Props {
    target: any;
}

export const TooForm = (props: Props) => {
    const { target } = props;

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
                        <Tooltip title={'target'}>
                            <TextField
                                id="target-name"
                                label={'target name'}
                                focused={target.name ? true : false}
                                sx={{ width: 200 }}
                                value={target.name}
                            />
                        </Tooltip>
                    </Stack>
                    <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title={'ra'}>
                            <TextField
                                label={'ra'}
                                id="ra"
                                sx={{ width: 150 }}
                                value={target.ra}
                                focused={target.ra ? true : false}
                            />
                        </Tooltip>
                        <Tooltip title={'dec'}>
                            <TextField
                                label={'dec'}
                                id="dec"
                                sx={{ width: 150 }}
                                value={target.dec}
                                focused={target.dec? true : false}
                            />
                        </Tooltip>
                    </Stack>
                    <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Tooltip title={'comment'}>
                            <TextField
                                label={'comment'}
                                id="comments"
                                sx={{ width: 400 }}
                            />
                        </Tooltip>
                    </Stack>
                </Box>
            </Paper>
        </Stack>
    )
}
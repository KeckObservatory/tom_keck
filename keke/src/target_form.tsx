import Stack from "@mui/material/Stack";
import { StyledPaper, type Target } from "./App";
import { Box, Button, TextField, Tooltip, Typography } from "@mui/material";

interface Props {
    target?: Target;
}

export const TargetForm = (props: Props) => {
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
            <StyledPaper
            >
                <Box>
                    <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                            <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                                {`Target name: ${target?.name || 'No target selected'}`} 
                            </Typography>
                            <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                                {`RA: ${target?.ra}`} 
                            </Typography>
                            <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                                {`Dec: ${target?.dec}`} 
                            </Typography>
                            <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                                {`Epoch: ${target?.epoch}`} 
                            </Typography>
                    </Stack>
                    <Tooltip title={'Visualize target using Keck\'s Planning Tool'}>
                        <Button
                            variant="contained"
                            onClick={() => {
                                console.log('Sending target to planning tool and opening in separate tab if sucessfull:', target);
                                // Add target to Planning Tool
                            }}
                        >
                            Send Target to Planning Tool
                        </Button>
                    </Tooltip>
                </Box>
            </StyledPaper>
        </Stack >
    )
}
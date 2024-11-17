import React, { useState } from 'react';
import { Box, Typography, Modal, Button, TextField } from '@mui/material';


interface ThresholdModalProps {
    visible: boolean;
    onClose: () => void;
    onUpdate: (value: bigint) => void;
    currentThreshold: bigint;
    maxThreshold: bigint;
}

const ThresholdModal: React.FC<ThresholdModalProps> = ({ visible, onClose, onUpdate, currentThreshold, maxThreshold }) => {
    const [threshold, setThreshold] = useState<string>(currentThreshold.toString());

    const handleUpdate = () => {
        onUpdate(BigInt(threshold));
        onClose();
    };

    return (
        <Modal
            open={visible}
            onClose={onClose}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1E1E1E' }}
        >
            <Box p={2} sx={{ bgcolor: "background.paper", borderRadius: 1, width: '300px' }}>
                <Typography variant="h6">Update Threshold</Typography>
                <Box mt={2}>
                    <TextField
                        value={threshold}
                        onChange={(event) => {
                            const value = event.target.value;
                            if (/^\d*$/.test(value)) {
                                setThreshold(value);
                            }
                        }}
                        fullWidth
                        size="small"
                        error={Number(threshold) > maxThreshold || Number(threshold) < 1}
                        helperText={Number(threshold) > maxThreshold || Number(threshold) < 1 ? `You only have ${maxThreshold} signers` : ''}
                    />
                </Box>
                <Box mt={2} display="flex" justifyContent="flex-end">
                    <Button onClick={onClose} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleUpdate}>
                        Update
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ThresholdModal;
import React, { useState } from 'react';
import { Box, Typography, Modal, Button, TextField } from '@mui/material';


interface ThresholdModalProps {
    visible: boolean;
    onClose: () => void;
    onUpdate: (value: bigint) => void;
    currentThreshold: bigint;
}

const ThresholdModal: React.FC<ThresholdModalProps> = ({ visible, onClose, onUpdate, currentThreshold }) => {
    const [threshold, setThreshold] = useState<bigint>(currentThreshold);

    const handleUpdate = () => {
        onUpdate(threshold);
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
                        value={Number(threshold)}
                        type='number'
                        onChange={(event) => setThreshold(event.target.value !== '' ? BigInt(event.target.value) : currentThreshold)}
                        fullWidth
                        size="small"
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
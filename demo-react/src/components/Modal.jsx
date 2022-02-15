import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '1px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 5,
};

const ModalAccept = ({ open, handleClose, sendTrx, clearSendTexForm }) => {
  const acept = () => {
    sendTrx();
    handleClose();
    clearSendTexForm();
  };
  return (
    <div>
      {/* <Button onClick={handleOpen}>Open modal</Button> */}
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Сonfirm the transfer
          </Typography>
          {/* <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
          </Typography> */}
          <Box sx={{ mt: 2 }}>
            <Button color="success" variant="contained" onClick={acept}>
              Сonfirm
            </Button>
            <Button color="error" sx={{ ml: 2 }} variant="contained" onClick={acept}>
              cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default ModalAccept;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Box,
  createTheme,
  CssBaseline,
  LinearProgress,
  Grid,
} from "@mui/material";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { registerUser } from "../../../api/users";

const CreateProfile: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (identity) {
      await registerUser(identity.getPrincipal(), firstName, lastName);
      navigate("/new-account/create");
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          bgcolor: "background.default",
          width: "100%",
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
            Registration
          </Typography>
          <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Enter your details
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="given-name"
                    autoFocus
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Create Profile
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default CreateProfile;

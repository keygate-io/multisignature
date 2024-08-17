import React, { useEffect, useState } from "react";
import { Form, Input, Button } from "antd";
import { hasAnAccount, isRegistered, registerUser } from "../../../api/users";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { useNavigate } from "react-router-dom";

const CreateProfile = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { identity, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    registerUser(identity!.getPrincipal(), firstName, lastName);
    navigate("/new-account/create");
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit}>
      <Form.Item label="First Name">
        <Input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </Form.Item>
      <Form.Item label="Last Name">
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </Form.Item>
      <Button type="primary" htmlType="submit" onClick={handleSubmit}>
        {" "}
          Create Profile
      </Button>
    </Form>
  );
};

export default CreateProfile;

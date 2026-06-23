import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
  Hr,
} from "react-email";

interface PasswordResetEmailProps {
  resetUrl: string;
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Timsrael Clothing</Heading>
          <Hr style={styles.hr} />
          <Section>
            <Heading as="h2" style={styles.subheading}>
              Password Reset Request
            </Heading>
            <Text style={styles.text}>
              You requested a password reset. Click the button below to reset
              your password. This link expires in 15 minutes.
            </Text>
            <Button href={resetUrl} style={styles.button}>
              Reset Password
            </Button>
            <Text style={styles.footer}>
              If you didn't request this, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#f9f9f9",
    fontFamily: "sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "32px",
    maxWidth: "520px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#000000",
    margin: "0 0 16px",
  },
  subheading: {
    fontSize: "18px",
    color: "#000000",
    margin: "16px 0 8px",
  },
  hr: {
    borderColor: "#eeeeee",
    margin: "16px 0",
  },
  text: {
    fontSize: "14px",
    color: "#444444",
    lineHeight: "1.6",
  },
  button: {
    backgroundColor: "#000000",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "4px",
    display: "inline-block",
    margin: "16px 0",
    fontSize: "14px",
    textDecoration: "none",
  },
  footer: {
    fontSize: "12px",
    color: "#888888",
    marginTop: "24px",
  },
};

export default PasswordResetEmail;

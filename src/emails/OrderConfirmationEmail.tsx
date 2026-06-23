import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
  Row,
  Column,
} from "react-email"
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailProps {
  orderId: string;
  totalAmount: number;
  items: OrderItem[];
}

export const OrderConfirmationEmail = ({
  orderId,
  totalAmount,
  items,
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Timsrael Clothing</Heading>
          <Hr style={styles.hr} />
          <Section>
            <Heading as="h2" style={styles.subheading}>
              Order Confirmed!
            </Heading>
            <Text style={styles.text}>
              Thank you for your order. Here's a summary:
            </Text>
            <Text style={styles.orderId}>
              Order ID: <strong>{orderId}</strong>
            </Text>
          </Section>

          <Section style={styles.tableHeader}>
            <Row>
              <Column style={styles.columnItem}>Item</Column>
              <Column style={styles.columnQty}>Qty</Column>
              <Column style={styles.columnPrice}>Price</Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {items.map((item, index) => (
            <Section key={index}>
              <Row>
                <Column style={styles.columnItem}>{item.name}</Column>
                <Column style={styles.columnQty}>{item.quantity}</Column>
                <Column style={styles.columnPrice}>
                  ₦{item.price.toLocaleString()}
                </Column>
              </Row>
              <Hr style={styles.rowDivider} />
            </Section>
          ))}

          <Section>
            <Text style={styles.total}>
              Total: ₦{totalAmount.toLocaleString()}
            </Text>
            <Text style={styles.text}>
              We'll notify you when your order ships.
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
  rowDivider: {
    borderColor: "#f5f5f5",
    margin: "8px 0",
  },
  text: {
    fontSize: "14px",
    color: "#444444",
    lineHeight: "1.6",
  },
  orderId: {
    fontSize: "14px",
    color: "#444444",
    margin: "8px 0 16px",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    padding: "8px 0",
  },
  columnItem: {
    fontSize: "13px",
    fontWeight: "bold",
    width: "60%",
    padding: "0 8px",
  },
  columnQty: {
    fontSize: "13px",
    fontWeight: "bold",
    width: "20%",
    textAlign: "center" as const,
    padding: "0 8px",
  },
  columnPrice: {
    fontSize: "13px",
    fontWeight: "bold",
    width: "20%",
    textAlign: "right" as const,
    padding: "0 8px",
  },
  total: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#000000",
    margin: "8px 0",
  },
};

export default OrderConfirmationEmail;

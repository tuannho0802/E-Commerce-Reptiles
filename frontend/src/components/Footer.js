import React from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

function Footer() {
  let date = new Date();
  let year = date.getFullYear();
  return (
    <Container fluid className="footer bg-dark text-white p-4">
      <Row>
        <Col md="4" className="footer-copyright">
          <h3 className="text-primary">
            Designed and Developed by Le Hoang Tuan
          </h3>
        </Col>
        <Col md="4" className="footer-copywright">
          <h3>Copyright © {year}</h3>
        </Col>
        <Col md="4" className="footer-body">
          <ul className="footer-icons list-unstyled">
            <li className="social-icons">
              <a
                href="https://www.facebook.com/TuanBlackU"
                style={{ color: "white" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-facebook fa-2x" />
              </a>
            </li>

            <li className="social-icons">
              <a
                href="https://www.tiktok.com/@tuanblack69"
                style={{ color: "white" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-tiktok fa-2x" />
              </a>
            </li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
}

export default Footer;

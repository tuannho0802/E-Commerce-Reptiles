import jwt from "jsonwebtoken";

// Function to get the base URL based on the environment
export const baseUrl = () =>
  process.env.BASE_URL
    ? process.env.BASE_URL
    : process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "https://reptiles-shop.onrender.com";

// Function to generate a JSON Web Token (JWT) for a user
export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30days" }
  );
};

// Middleware function to check if a user is authenticated
export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        res.status(401).send({ message: "Invalid Token" });
      } else {
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(401).send({ message: "No Token" });
  }
};

// Middleware function to check if a user is an admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send({ message: "Invalid Admin Token" });
  }
};

// Function to generate an email template for a payment confirmation
export const payOrderEmailTemplate = (order) => {
  return `<h1>Thanks for shopping with us!!</h1>
  <p>
  Hi ${order.user.name},</p>
  <p>We have finished processing your order.</p>
  <h2>[Order ${order._id}] (${order.createdAt.toString().substring(0, 10)})</h2>
  <table>
  <thead>
  <tr>
  <td><strong>Product</strong></td>
  <td><strong>Quantity</strong></td>
  <td style={{marginLeft:"10px"}}><strong align="right">Price</strong></td>
  </thead>
  <tbody>
  ${order.orderItems
    .map(
      (item) => `
    <tr>
    <td>${item.name}</td>
    <td align="center">${item.quantity}</td>
    <td align="right"> $${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join("\n")}
  </tbody>
  <tfoot>
  <tr>
  <td colspan="2">Items Price:</td>
  <td align="right"> $${order.itemsPrice.toFixed(2)}</td>
  </tr>
  <tr>
  <td colspan="2">Shipping Price:</td>
  <td align="right"> $${order.shippingPrice.toFixed(2)}</td>
  </tr>
  <tr>
  <td colspan="2"><strong>Total Price:</strong></td>
  <td align="right"><strong> $${order.totalPrice.toFixed(2)}</strong></td>
  </tr>
  <tr>
  <td colspan="2">Payment Method:</td>
  <td align="right">${order.paymentMethod}</td>
  </tr>
  </table>
  <h2>Shipping address</h2>
  <p>
  ${order.shippingAddress.fullName},<br/>
  ${order.shippingAddress.address},<br/>
  ${order.shippingAddress.city},<br/>
  ${order.shippingAddress.country},<br/>
  ${order.shippingAddress.postalCode}<br/>
  </p>
  <hr/>
  <p>
  Thank you for crediting our store
  </p>
  `;
};

// Function to generate an email template for an order delivery confirmation
export const deliverOrderEmailTemplate = (order) => {
  return `<h1>Your order has been completed and is on its way!!</h1>
  <p>
    Hi ${order.user.name},</p>
  <p>We are d to let you know that your order is on its way to you!!.</p>
  <h2>[Order ${order._id}] (${order.createdAt.toString().substring(0, 10)})</h2>
  <table>
    <thead>
      <tr>
        <td><strong>Product</strong></td>
        <td><strong>Quantity</strong></td>
        <td style={{ marginLeft: "10px" }}><strong align="right">Price</strong></td>
      </tr>
    </thead>
    <tbody>
      ${order.orderItems
        .map(
          (item) => `
        <tr>
          <td>${item.name}</td>
          <td align="center">${item.quantity}</td>
          <td align="right"> $${item.price.toFixed(2)}</td>
        </tr>
      `
        )
        .join("\n")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Items Price:</td>
        <td align="right"> $${order.itemsPrice.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2">Shipping Price:</td>
        <td align="right"> $${order.shippingPrice.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>Total Price:</strong></td>
        <td align="right"><strong> $${order.totalPrice.toFixed(2)}</strong></td>
      </tr>
    </tfoot>
  </table>
  <h2>Shipping address</h2>
  <p>
    ${order.shippingAddress.fullName},<br/>
    ${order.shippingAddress.address},<br/>
    ${order.shippingAddress.city},<br/>
    ${order.shippingAddress.country},<br/>
    ${order.shippingAddress.postalCode}<br/>
  </p>
  <hr/>
  <p>
    Thank you for choosing our store. We hope you enjoy your products!
  </p>
  `;
};

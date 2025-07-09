const Api = require("../utils/api");
const Mail = require("../services/mailService");
const Sms = require('../services/smsService');
const walletService = require('../services/walletService');

const ccavanue = require('../utils/ccavenue');
const FormData = require("form-data");
const {
  payment_url,
  merchant_id,
  accessCode,
  workingKey,
} = require('../config/payment');

const {
  baseUrl,
  clientUrl
} = require('../config/index');

const Transaction = require('../models/hoteltransactions');

const url = require('url');

const invoice = require('../utils/invoice');
const voucher = require('../utils/voucher');

const logger = require('../config/logger');

/**
 * Process payment for hotel booking
 * Made by: Amber Bisht
 * @param {Object} req - Request object containing booking ID in params
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @description Handles payment processing through CCAvenue payment gateway
 * @returns {String} HTML form for payment gateway redirect
 */
exports.processPayment = async (req, res, next) => {

  if (!req.params.id) {
    const error = new Error('Booking Id is required');
    error.statusCode = 400
    return next(error);
  }

  let data;
  try {
    data = await Transaction.findOne({
      "prebook_response.data.booking_id": req.params.id
    });
  } catch (err) {
    return next(err);
  }

  if (!data) {
    const error = new Error('Sorry invalid Booking ID, try another id');
    error.statusCode = 404;
    return next(error);
  }

  if (!data.prebook_response) {
    const error = new Error('Transaction is not complete. Please try again.');
    error.statusCode = 500;
    return next(error);
  }

  const createdAt = new Date(data.created_at).getTime();
  // check if booking session is expired
  // booking session will be expired after 20 (20*60*1000 milliseconds) minutes of prebook
  const expiry = createdAt + 20 * 60 * 1000;
  const isExpired = Date.now() > expiry;

  // console.log(isExpired, createdAt, Date.now())

  if (isExpired) {
    console.log("Booking session expired. Cannot process payment.");
    const error = new Error('Booking session expired. Please try again.');
    error.statusCode = 422;
    return next(error);
  }

  if (data.payment_response && data.payment_response.order_status === "Success") {
    console.log("Payment is already done");
    const error = new Error('Booking session expired. Please try again!');
    error.statusCode = 422;
    return next(error);
  }

  data.status = 3; // payment pending
  await data.save();

  const payload = {
    merchant_id: merchant_id,
    order_id: data._id,
    currency: data.pricing.currency,
    billing_name: data.contactDetail.name,
    billing_email: data.contactDetail.email,
    billing_tel: data.contactDetail.mobile,
    booking_id: req.params.id,
    amount: 100,
    redirect_url: `${baseUrl}/api/hotels/payment-response-handler`,
    cancel_url: `${baseUrl}/api/hotels/payment-response-handler`,
    language: 'EN'
  };

  console.log(payload);

  // Convert payload to form data string
  const formData = new FormData();
  Object.keys(payload).forEach(key => {
    formData.append(key, String(payload[key]));
  });
  
  // Convert to string format expected by CCAvenue
  const formDataString = Object.keys(payload)
    .map(key => `${key}=${encodeURIComponent(String(payload[key]))}`)
    .join('&');

  const encRequest = ccavanue.encrypt(formDataString, workingKey);

  // const formbody = '<form id="nonseamless" method="post" name="redirect" action="' + payment_url + '"/> <input type="hidden" id="encRequest" name="encRequest" value="' + encRequest + '"><input type="hidden" name="access_code" id="access_code" value="' + accessCode + '"><script language="javascript">document.redirect.submit();</script></form>';
  const formbody = `
  <form id="nonseamless" method="post" name="redirect" action="${payment_url}">
    <input type="hidden" id="encRequest" name="encRequest" value="${encRequest}">
    <input type="hidden" name="access_code" id="access_code" value="${accessCode}">
    <script language="javascript">
      document.redirect.submit();
    </script>
  </form>
`;
  console.log(formbody);
  res.send(formbody);

};

/**
 * Handle payment response from payment gateway
 * Updated by: Amber Bisht
 * @param {Object} req - Request object containing payment response data
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @description Processes payment response, updates booking status, sends notifications
 * and generates booking documents (invoice/voucher)
 * @returns {void} Redirects to success/failure page based on payment status
 */
exports.paymentResponseHandler = async (req, res, next) => {
  console.log('Payment response...');
  console.log(req.body);

  const orderNo = req.body.orderNo;
  const encResp = req.body.encResp;

  const bookingFailedMsg = `Due to some technical problem the booking is not confirmed. The amount will be refunded if it is deducted from your account. Kindly book again.  Please write an email to support@delonixtravel.com incase of further queries.`;

  if (!orderNo) {
    const error = new Error('OrderNo missing from payment_response from ccavanue.');
    error.statusCode = 500;
    return next(error);
  }
  // console.log('Booking ID: ' + orderNo);
  const dataObj = await Transaction.findById(orderNo);
  // console.log(dataObj);
  if (!dataObj) {
    const error = new Error('Sorry invalid OrderNo, cannot find any transaction with this order no');
    error.statusCode = 500;
    return next(error);
  }

  const paymentData = ccavanue.decrypt(encResp, workingKey);
  const queryStrings = url.parse("/?" + paymentData, true).query;
  //storing payment response
  dataObj.payment_response = queryStrings;

  if (queryStrings.order_status === "Success") {
    // redirect to success

    dataObj.status = 4; // payment success
    await dataObj.save();

    // doing the actual booking
    let data;
    try {
      data = await Api.post("/book", {
        "book": {
          "booking_id": dataObj.prebook_response.data.booking_id
        }
      });
    } catch (err) {
      logger.error(err);
      logger.info(err);
      logger.log(`log + ${err}`);
      const error = new Error(bookingFailedMsg);
      error.statusCode = 500;

      dataObj.status = 5; // booking failed
      dataObj.save();

      return next(error);
    }

    if (!data || !data.data) {
      console.log(data);
      return res.status(500).send(bookingFailedMsg);
    }

    dataObj.status = 1; // booking_success
    dataObj.book_response = data;

    // @TODO:- handle if data response is not saved in db
    try {
      await dataObj.save();
    } catch (err) {
      logger.log(`hotel book_response not saved.. Error ${err}`);
    }

    const {
      _id: bookingId,
      contactDetail,
      hotel,
      pricing
    } = dataObj;

    const smsGuest = `Dear ${contactDetail.name}, Your Hotel ${hotel.originalName} has been booked and the bookingId is ${bookingId}. Thank you !`;

    const locationInfo = hotel.location ? `${hotel.location.address || ''}, ${hotel.location.city || ''}, ${hotel.location.country || hotel.location?.countryCode || ''}` : 'Location not available';
    const smsAdmin = `Hello Admin, new booking received. bookingId: ${bookingId}, Guest name: ${contactDetail.name} ${contactDetail.last_name}, Hotel name: ${hotel.originalName}, Amount: ${pricing.currency} ${pricing.total_chargeable_amount}, Payment mode: ${queryStrings.payment_mode}, Location: ${locationInfo}`;

    try {
      const guestRes = Sms.send(contactDetail.mobile, smsGuest);
      const adminRes = Sms.send("917678105666", smsAdmin);

      Promise.all([guestRes, adminRes])
        .then((data) => {
          console.log(data);
          console.log("sms sent successfully");
        })
        .catch((err) => {
          throw err;
        })

      // if (guestRes.type != "success") {
      //   throw new Error('Failed to send the sms');
      // }

      // if (adminRes.type != "success") {
      //   throw new Error('Failed to send the sms');
      // }

      // if (admin2Res.type != "success") {
      //   throw new Error('');
      // }

    } catch (err) {
      console.log("Failed to send the sms", err);
    }

    let invoiceBuffer = await invoice.generateInvoice(dataObj);
    invoiceBuffer = invoiceBuffer.toString('base64');
    let voucherBuffer = await voucher.generateVoucher(dataObj);
    voucherBuffer = voucherBuffer.toString('base64');

    const msg = {
      to: dataObj.contactDetail.email,
      subject: 'TripBazaar Confim Ticket',
      text: `Dear ${contactDetail.name}, Your Hotel ${hotel.originalName} has been booked and the bookingId is ${bookingId}. Thank you !`,
      attachments: [{
        filename: 'Invoice.pdf',
        content: invoiceBuffer,
        type: 'application/pdf',
        disposition: 'attachment',
        contentId: 'myId'
      }, {
        filename: 'Voucher.pdf',
        content: voucherBuffer,
        type: 'application/pdf',
        disposition: 'attachment',
        contentId: 'myId'
      }],
      html: `Dear ${contactDetail.name}, Your Hotel ${hotel.originalName} has been booked and the booking reference no. is ${bookingId}. Thank you !`,
    };

    const msgAdmin = {
      to: 'ankit.phondani@delonixtravel.com',
      subject: 'TripBazaar Confim Ticket',
      html: `Hello Admin, new booking received. bookingId: ${bookingId}, Hotel name: ${hotel.originalName}, Amount: ${pricing.currency} ${pricing.total_chargeable_amount}, Payment mode: ${queryStrings.payment_mode}, Location: ${locationInfo}`,
      attachments: [{
          filename: 'Invoice.pdf',
          content: invoiceBuffer,
          type: 'application/pdf',
          disposition: 'attachment',
          contentId: 'myId1'
        },
        {
          filename: 'Voucher.pdf',
          content: voucherBuffer,
          type: 'application/pdf',
          disposition: 'attachment',
          contentId: 'myId2'
        }
      ]
    };
    try {
      Mail.send(msg);
      Mail.send(msgAdmin);
    } catch (err) {
      console.log("Failed to send mail", err);
    }
    res.redirect(`${clientUrl}/hotels/hotelvoucher?id=${dataObj._id}`);
  } else {
    // redirect to failed page
    dataObj.status = 6; // payment failed 
    dataObj.save();
    // res.redirect(`${clientUrl}/hotels/hoteldetails`);
    return res.status(500).send(bookingFailedMsg);
  }
};

/**
 * Confirm booking and redirect to payment
 * Made by: Amber Bisht
 * @param {Object} req - Request object containing booking data
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @description Handles booking confirmation and redirects to payment gateway
 * @returns {Object} JSON response with payment URL or booking status
 */
exports.confirmBooking = async (req, res, next) => {
  try {
    const { transactionId, bookingId } = req.body;

    if (!transactionId || !bookingId) {
      const error = new Error('Transaction ID and Booking ID are required');
      error.statusCode = 400;
      return next(error);
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      _id: transactionId,
      "prebook_response.data.booking_id": bookingId
    });

    if (!transaction) {
      const error = new Error('Transaction not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check if booking is already confirmed
    if (transaction.status === 1) {
      return res.status(200).json({
        success: true,
        message: 'Booking already confirmed',
        bookingId: transaction._id,
        status: 'confirmed'
      });
    }

    // Check if payment is already done
    if (transaction.payment_response && transaction.payment_response.order_status === "Success") {
      return res.status(200).json({
        success: true,
        message: 'Payment already completed',
        bookingId: transaction._id,
        status: 'paid'
      });
    }

    // Check if booking session is expired
    const createdAt = new Date(transaction.created_at).getTime();
    const expiry = createdAt + 20 * 60 * 1000; // 20 minutes
    const isExpired = Date.now() > expiry;

    if (isExpired) {
      const error = new Error('Booking session expired. Please try again.');
      error.statusCode = 422;
      return next(error);
    }

    // Update transaction status to payment pending
    transaction.status = 3; // payment pending
    await transaction.save();

    // Generate payment URL
    const paymentUrl = `${req.protocol}://${req.get('host')}/api/hotels/process-payment/${bookingId}`;

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed. Redirecting to payment...',
      paymentUrl,
      bookingId: transaction._id,
      status: 'payment_pending'
    });

  } catch (err) {
    console.error('Error confirming booking:', err);
    return next(err);
  }
};

/**
 * Process wallet payment for hotel booking
 * Made by: Assistant
 * @param {Object} req - Request object containing booking ID and payment method
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @description Handles wallet payment processing for hotel bookings
 * @returns {Object} JSON response with payment status
 */
exports.processWalletPayment = async (req, res, next) => {
  try {
    const { transactionId, bookingId } = req.body;
    const userType = req.user.type; // 'company' or 'employee'
    const userId = req.user.id;

    if (!transactionId || !bookingId) {
      const error = new Error('Transaction ID and Booking ID are required');
      error.statusCode = 400;
      return next(error);
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      _id: transactionId,
      "prebook_response.data.booking_id": bookingId
    });

    if (!transaction) {
      const error = new Error('Transaction not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check if booking is already confirmed
    if (transaction.status === 1) {
      return res.status(200).json({
        success: true,
        message: 'Booking already confirmed',
        bookingId: transaction._id,
        status: 'confirmed'
      });
    }

    // Check if payment is already done
    if (transaction.payment_response && transaction.payment_response.order_status === "Success") {
      return res.status(200).json({
        success: true,
        message: 'Payment already completed',
        bookingId: transaction._id,
        status: 'paid'
      });
    }

    // Check if booking session is expired
    const createdAt = new Date(transaction.created_at).getTime();
    const expiry = createdAt + 20 * 60 * 1000; // 20 minutes
    const isExpired = Date.now() > expiry;

    if (isExpired) {
      const error = new Error('Booking session expired. Please try again.');
      error.statusCode = 422;
      return next(error);
    }

    // Get company ID based on user type
    let companyId;
    if (userType === 'company') {
      companyId = userId;
    } else if (userType === 'employee') {
      // For employees, get their company ID
      const { Employee } = require('../models/user');
      const employee = await Employee.findById(userId);
      if (!employee) {
        const error = new Error('Employee not found');
        error.statusCode = 404;
        return next(error);
      }
      companyId = employee.company;
    } else {
      const error = new Error('Invalid user type for wallet payment');
      error.statusCode = 400;
      return next(error);
    }

    // Get payment amount from transaction
    const paymentAmount = transaction.pricing.total_chargeable_amount || 0;
    if (paymentAmount <= 0) {
      const error = new Error('Invalid payment amount');
      error.statusCode = 400;
      return next(error);
    }

    // Check wallet balance
    const hasBalance = await walletService.hasSufficientBalance(companyId, paymentAmount);
    if (!hasBalance) {
      const walletInfo = await walletService.getWalletBalance(companyId);
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        data: {
          requiredAmount: paymentAmount,
          currentBalance: walletInfo.wallet.balance,
          currency: walletInfo.wallet.currency
        }
      });
    }

    // Process wallet payment
    const walletPaymentResult = await walletService.processWalletPayment(
      companyId, 
      paymentAmount, 
      bookingId
    );

    if (!walletPaymentResult.success) {
      return res.status(400).json({
        success: false,
        message: walletPaymentResult.message
      });
    }

    // Update transaction status to payment success
    transaction.status = 4; // payment success
    transaction.payment_response = {
      order_status: "Success",
      payment_mode: "Wallet",
      amount: paymentAmount,
      wallet_transaction: walletPaymentResult.data
    };
    await transaction.save();

    // Process the actual booking
    let bookingData;
    try {
      bookingData = await Api.post("/book", {
        "book": {
          "booking_id": transaction.prebook_response.data.booking_id
        }
      });
    } catch (err) {
      logger.error('Booking API error:', err);
      
      // If booking fails, refund the wallet amount
      try {
        await walletService.addToWallet(
          companyId, 
          paymentAmount, 
          `Refund for failed booking - ${bookingId}`
        );
        logger.info('Wallet refunded for failed booking', { companyId, bookingId, amount: paymentAmount });
      } catch (refundError) {
        logger.error('Failed to refund wallet for failed booking:', refundError);
      }

      const error = new Error('Booking failed. Amount will be refunded to wallet.');
      error.statusCode = 500;
      return next(error);
    }

    if (!bookingData || !bookingData.data) {
      // If booking fails, refund the wallet amount
      try {
        await walletService.addToWallet(
          companyId, 
          paymentAmount, 
          `Refund for failed booking - ${bookingId}`
        );
        logger.info('Wallet refunded for failed booking', { companyId, bookingId, amount: paymentAmount });
      } catch (refundError) {
        logger.error('Failed to refund wallet for failed booking:', refundError);
      }

      return res.status(500).json({
        success: false,
        message: 'Booking failed. Amount will be refunded to wallet.'
      });
    }

    // Update transaction with booking response
    transaction.status = 1; // booking_success
    transaction.book_response = bookingData;
    await transaction.save();

    // Send notifications
    const {
      _id: finalBookingId,
      contactDetail,
      hotel,
      pricing
    } = transaction;

    const smsGuest = `Dear ${contactDetail.name}, Your Hotel ${hotel.originalName} has been booked and the bookingId is ${finalBookingId}. Payment made via wallet. Thank you !`;

    const locationInfo = hotel.location ? `${hotel.location.address || ''}, ${hotel.location.city || ''}, ${hotel.location.country || hotel.location?.countryCode || ''}` : 'Location not available';
    const smsAdmin = `Hello Admin, new wallet booking received. bookingId: ${finalBookingId}, Guest name: ${contactDetail.name} ${contactDetail.last_name}, Hotel name: ${hotel.originalName}, Amount: ${pricing.currency} ${pricing.total_chargeable_amount}, Payment mode: Wallet, Location: ${locationInfo}`;

    try {
      const guestRes = Sms.send(contactDetail.mobile, smsGuest);
      const adminRes = Sms.send("917678105666", smsAdmin);

      Promise.all([guestRes, adminRes])
        .then((data) => {
          console.log("sms sent successfully");
        })
        .catch((err) => {
          console.log("Failed to send sms", err);
        });
    } catch (err) {
      console.log("Failed to send the sms", err);
    }

    // Generate and send documents
    try {
      let invoiceBuffer = await invoice.generateInvoice(transaction);
      invoiceBuffer = invoiceBuffer.toString('base64');
      let voucherBuffer = await voucher.generateVoucher(transaction);
      voucherBuffer = voucherBuffer.toString('base64');

      const msg = {
        to: transaction.contactDetail.email,
        subject: 'TripBazaar Confirm Ticket - Wallet Payment',
        text: `Dear ${contactDetail.name}, Your Hotel ${hotel.originalName} has been booked and the bookingId is ${finalBookingId}. Payment made via wallet. Thank you !`,
        attachments: [{
          filename: 'Invoice.pdf',
          content: invoiceBuffer,
          type: 'application/pdf',
          disposition: 'attachment',
          contentId: 'myId'
        }, {
          filename: 'Voucher.pdf',
          content: voucherBuffer,
          type: 'application/pdf',
          disposition: 'attachment',
          contentId: 'myId'
        }],
        html: `Dear ${contactDetail.name}, Your Hotel ${hotel.originalName} has been booked and the booking reference no. is ${finalBookingId}. Payment made via wallet. Thank you !`,
      };

      const msgAdmin = {
        to: 'ankit.phondani@delonixtravel.com',
        subject: 'TripBazaar Confirm Ticket - Wallet Payment',
        html: `Hello Admin, new wallet booking received. bookingId: ${finalBookingId}, Hotel name: ${hotel.originalName}, Amount: ${pricing.currency} ${pricing.total_chargeable_amount}, Payment mode: Wallet, Location: ${locationInfo}`,
        attachments: [{
            filename: 'Invoice.pdf',
            content: invoiceBuffer,
            type: 'application/pdf',
            disposition: 'attachment',
            contentId: 'myId1'
          },
          {
            filename: 'Voucher.pdf',
            content: voucherBuffer,
            type: 'application/pdf',
            disposition: 'attachment',
            contentId: 'myId2'
          }
        ]
      };

      Mail.send(msg);
      Mail.send(msgAdmin);
    } catch (err) {
      console.log("Failed to send mail", err);
    }

    return res.status(200).json({
      success: true,
      message: 'Wallet payment and booking completed successfully',
      data: {
        bookingId: transaction._id,
        status: 'confirmed',
        paymentMethod: 'wallet',
        amount: paymentAmount,
        walletTransaction: walletPaymentResult.data,
        voucherUrl: `${clientUrl}/hotels/hotelvoucher?id=${transaction._id}`
      }
    });

  } catch (error) {
    console.error('Wallet payment error:', error);
    return next(error);
  }
};

/**
 * Get wallet balance for current user/company
 * Made by: Assistant
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @description Returns wallet balance for the authenticated company or employee's company
 * @returns {Object} JSON response with wallet balance
 */
exports.getWalletBalance = async (req, res, next) => {
  try {
    const userType = req.user.type; // 'company' or 'employee'
    const userId = req.user.id;

    let companyId;
    if (userType === 'company') {
      companyId = userId;
    } else if (userType === 'employee') {
      // For employees, get their company ID
      const { Employee } = require('../models/user');
      const employee = await Employee.findById(userId);
      if (!employee) {
        const error = new Error('Employee not found');
        error.statusCode = 404;
        return next(error);
      }
      companyId = employee.company;
    } else {
      const error = new Error('Invalid user type');
      error.statusCode = 400;
      return next(error);
    }

    const walletInfo = await walletService.getWalletBalance(companyId);

    res.status(200).json({
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: walletInfo
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    return next(error);
  }
};

/**
 * Check wallet payment eligibility
 * Made by: Assistant
 * @param {Object} req - Request object containing transaction ID and booking ID
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @description Checks if wallet payment is possible for a given booking
 * @returns {Object} JSON response with eligibility status
 */
exports.checkWalletPaymentEligibility = async (req, res, next) => {
  try {
    const { transactionId, bookingId } = req.body;
    const userType = req.user.type;
    const userId = req.user.id;

    if (!transactionId || !bookingId) {
      const error = new Error('Transaction ID and Booking ID are required');
      error.statusCode = 400;
      return next(error);
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      _id: transactionId,
      "prebook_response.data.booking_id": bookingId
    });

    if (!transaction) {
      const error = new Error('Transaction not found');
      error.statusCode = 404;
      return next(error);
    }

    // Get company ID based on user type
    let companyId;
    if (userType === 'company') {
      companyId = userId;
    } else if (userType === 'employee') {
      const { Employee } = require('../models/user');
      const employee = await Employee.findById(userId);
      if (!employee) {
        const error = new Error('Employee not found');
        error.statusCode = 404;
        return next(error);
      }
      companyId = employee.company;
    } else {
      const error = new Error('Invalid user type for wallet payment');
      error.statusCode = 400;
      return next(error);
    }

    // Get payment amount
    const paymentAmount = transaction.pricing.total_chargeable_amount || 0;
    
    // Get wallet balance
    const walletInfo = await walletService.getWalletBalance(companyId);
    const hasBalance = await walletService.hasSufficientBalance(companyId, paymentAmount);

    res.status(200).json({
      success: true,
      message: 'Wallet payment eligibility checked',
      data: {
        eligible: hasBalance,
        requiredAmount: paymentAmount,
        currentBalance: walletInfo.wallet.balance,
        currency: walletInfo.wallet.currency,
        insufficientAmount: hasBalance ? 0 : paymentAmount - walletInfo.wallet.balance
      }
    });

  } catch (error) {
    console.error('Check wallet eligibility error:', error);
    return next(error);
  }
};
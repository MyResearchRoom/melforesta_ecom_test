const { Op, where } = require("sequelize")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { transporter } = require("../services/emailService");
const { User } = require("../models");
const sendEmail = require("../utils/sendEmail");
const moment = require("moment");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const authController = {

    async register(req, res) {
        try {
            const { name, email, mobileNumber, gender, address, role, password } = req.body;

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already registered"
                })
            }

            const existingMobile = await User.findOne({ where: { mobileNumber } });
            if (existingMobile) {
                return res.status(400).json({
                    success: false,
                    message: "Mobile number already registered"
                })
            }


            const hashedPassword = await bcrypt.hash(password, 10);

            let profile = null;
            let profileContentType = null;

            if (req.file) {
                profile = req.file.buffer;
                profileContentType = req.file.mimetype
            }

            const newUser = await User.create({
                name,
                email,
                mobileNumber,
                gender,
                address,
                role,
                isBlock: req.body.isBlock ?? false,
                password: hashedPassword,
                profile,
                profileContentType
            })

            return res.status(201).json({
                success: true,
                message: "User Registered Successfully",
                data: newUser
            });
        } catch (error) {            
            return res.status(500).json({
                success: false,
                message: "Failed to register"
            });
        }
    },

    async customerRegister(req, res) {
        try {
            const { name, email, mobileNumber, gender, role, password } = req.body;

            // console.log( name, email, mobileNumber, gender, address, role, password);
            
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already registered"
                })
            }

            const existingMobile = await User.findOne({ where: { mobileNumber } });
            if (existingMobile) {
                return res.status(400).json({
                    success: false,
                    message: "Mobile number already registered"
                })
            }


            const hashedPassword = await bcrypt.hash(password, 10);

            const otp = generateOtp();
            const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

            await sendEmail(email, "Verification OTP", "", otp);

            // let profile = null;
            // let profileContentType = null;

            // if (req.file) {
            //     profile = req.file.buffer;
            //     profileContentType = req.file.mimetype
            // }

            const newCustomer = await User.create({
                name,
                email,
                mobileNumber,
                gender,
                role,
                isBlock: req.body.isBlock ?? false,
                password: hashedPassword,
                // profile,
                // profileContentType
                otp,
                otpExpires,
            })

            return res.status(201).json({
                success: true,
                message: "User Registered Successfully and Otp sent to your email",
                data: newCustomer
            });
        } catch (error) {            
            return res.status(500).json({
                success: false,
                message: "Failed to register"
            });
        }
    },

    // async login(req, res) {
    //     try {
    //         const { role, email, password } = req.body;

    //         if (!role || !email || !password) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: "Please provide role, email and password"
    //             });
    //         }

    //         const user = await User.findOne({ where: { email, role } });

    //         if (!user) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: "User not found"
    //             });
    //         }

    //         if (user.isBlock) {
    //             return res.status(403).json({
    //                 success: false,
    //                 message: "Your account has been blocked please contact admin"
    //             });
    //         }

    //         const isMatch = await bcrypt.compare(password, user.password);

    //         if (!isMatch) {
    //             return res.status(401).json({
    //                 success: false,
    //                 message: "Invalid credentials"
    //             });
    //         }

    //         const token = jwt.sign(
    //             {
    //                 id: user.id,
    //                 role: user.role
    //             },
    //             process.env.JWT_SECRET,
    //             { expiresIn: "7d" }
    //         );

    //         return res.status(200).json({
    //             success: true,
    //             message: "Login Successfull",
    //             data: {
    //                 id: user.id,
    //                 name: user.name,
    //                 role: user.role,
    //                 token
    //             }
    //         });

    //     } catch (error) {
    //         return res.status(500).json({
    //             success: false,
    //             message: "Failed to login"
    //         })
    //     }
    // },

    async login(req, res) {
        try {
            const { role, email, password } = req.body;

            if (!role || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide role, email and password"
                });
            }

            const user = await User.findOne({ where: { email, role } });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            if (user.isBlock) {
                return res.status(403).json({
                    success: false,
                    message: "Access is restricted. Please contact your admin for assistance."
                });
            }

            if (user.role !== role) {
                return res.status(401).json({
                    success: false,
                    message: " Unauthorized role",
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }

            const otp = generateOtp();
            user.otp = otp;
            user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
            await user.save();

            await sendEmail(user.email, "Login Verification OTP", "", otp);

            // const token = jwt.sign(
            //     {
            //         id: user.id,
            //         role: user.role
            //     },
            //     process.env.JWT_SECRET,
            //     { expiresIn: "7d" }
            // );

            // return res.status(200).json({
            //     success: true,
            //     message: "Login Successfull",
            //     data: {
            //         id: user.id,
            //         name: user.name,
            //         role: user.role,
            //         token
            //     }
            // });

            return res.status(200).json({
                success: true,
                message: "Otp sent to your registered email address",
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to login"
            })
        }
    },

    async verifyOtpLogin(req, res) {
        const { email, otp } = req.body;
        // console.log(email, otp );
        

        if (!email || !otp) {
            return res.status(400).json({
            success: false,
            message: "Email and otp are required",
            });
        }

        try {
            const user = await User.findOne({ where: { email } });

            if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
            }

            if (!user.otp || !user.otpExpires) {
            return res.status(400).json({
                message: "OTP not generated. Please login again.",
            });
            }

            const currentTime = moment();

            if (user.otp !== otp) {
            return res.status(401).json({
                message: "Invalid OTP.",
            });
            }

            if (currentTime.isAfter(moment(user.otpExpires))) {
            return res.status(401).json({
                message: "OTP has expired. Please login again.",
            });
            }

            user.otp = null;
            user.otpExpires = null;
            await user.save();

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            const role=user.role;
            const message = role === "CUSTOMER" ? "OTP Verified Successfully.." : "OTP verified - Login successfull"

            return res.status(200).json({
                success: true,
                message: message,
                data: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    token
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
            success: false,
            message: "Failed to Login",
            });
        }
    },

    async resendOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email ) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
            }

            const user = await User.findOne({ where: { email } });

            if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
            }

            if (!user.otp || !user.otpExpires) {
            return res.status(400).json({
                message: "OTP not generated. Please login again.",
            });
            }

            if (user.isBlock) {
            return res.status(404).json({
                success: false,
                message: "Your account is blocked. Please contact admin.",
            });
            }

            const otp = generateOtp();
            user.otp = otp;
            user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
            await user.save();

            await sendEmail(user.email, "Resent Login Verification Otp", "", otp);

            return res.status(200).json({
                success: true,
                message: "OTP resent successfully",
            });
        } catch (error) {
            return res.status(500).json({
            success: false,
            message: "Failed to resent OTP",
            });
        }
    },

    async getStaffList(req, res) {
        try {
            const { page = 1, limit = 10, role, search } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {
                role: ["ADMIN", "PRODUCT_MANAGER", "DELIVERY_ASSOCIATE"],
            };

            if (role) {
                whereClause.role = role;
            }

            if (search) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { mobileNumber: { [Op.like]: `%${search}%` } },
                ]
            }

            const { rows: staff, count: totalRecords } = await User.findAndCountAll({
                where: whereClause,
                attributes: ["id", "name", "email", "mobileNumber", "gender", "address", "role", "isBlock", "profile","profileContentType"],
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
            });

            const staffList = staff.map(user => ({
                ...user.toJSON(),
                //  image: `data:${img.imageContentType};base64,${img.image.toString("base64")}`
                profile: user.profile ? `data:${user.profileContentType};base64,${user.profile.toString("base64")}` : null
            }));

            return res.status(200).json({
                success: true,
                message: "Staff list fetched successfully",
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                data: staffList
            })
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch staff list"
            })
        }
    },

    async getStaffDetailsById(req, res) {
        try {
            const { id } = req.params;

            const staff = await User.findOne({
                where: {
                    id,
                    role: ["ADMIN", "PRODUCT_MANAGER", "CUSTOMER", "DELIVERY_ASSOCIATE"]
                },
                attributes: [
                    "id",
                    "name",
                    "email",
                    "mobileNumber",
                    "gender",
                    "address",
                    "role",
                    "isBlock",
                    "profile",
                    "profileContentType"
                ],
            });

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: "Staff not found",
                });
            }

            const staffData = {
                ...staff.toJSON(),
                profile: staff.profile
                    ? `data:${staff.profileContentType};base64,${staff.profile.toString("base64")}`
                    : null
            };

            return res.status(200).json({
                success: true,
                message: "Staff details fetched successfully",
                data: staffData
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to get staff details"
            })
        }
    },

    async editStaff(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }
            const { name, email, mobileNumber, gender, address, role } = req.body;

            const staff = await User.findByPk(id);
            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: "Staff not found",
                });
            }

            const existingUser = await User.findOne({
                where: {
                    email,
                    id: {[Op.ne]: id,},
                    role: role
                },
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User with this details already exists.",
                });
            }

            staff.name = name || staff.name;
            staff.email = email || staff.email;
            staff.mobileNumber = mobileNumber || staff.mobileNumber;
            staff.gender = gender || staff.gender;
            staff.address = address || staff.address;
            staff.role = role || staff.role;

            if (req.file) {
                staff.profile = req.file.buffer;
                staff.profileContentType = req.file.mimetype;
            }

            await staff.save();

            // await staff.save();

            return res.status(200).json({
                success: true,
                message: "Staff updated successfully",
                data: {
                    id: staff.id,
                    name: staff.name,
                    email: staff.email,
                    mobileNumber: staff.mobileNumber,
                    gender: staff.gender,
                    address: staff.address,
                    role: staff.role,
                },
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message: "Failed to update staff",
            });
        }
    },

    async blockStaff(req, res) {

        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }

            const staff = await User.findByPk(id);
            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: "Staff not found",
                });
            }

            staff.isBlock = !staff.isBlock;
            await staff.save();

            return res.status(200).json({
                success: true,
                message: `Staff ${staff.isBlock ? "Blocked" : "Unblocked"} successfully`,
                data: {
                    id: staff.id,
                    name: staff.name,
                    role: staff.role,
                    isBlock: staff.isBlock,
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to block/unblock staff"
            });
        }
    },

    async changePassword(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }
            const { newPassword, confirmPassword } = req.body;

            if (!newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide both New Password and Confirm Password"
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "New Password does not match with Confirm Password"
                });
            }

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Password changed successfully."
            })

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to change password "
            });
        }
    },

    async deleteStaff(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }

            const staff = await User.findByPk(id);
            if (!staff) {
                return res.status(400).json({
                    success: false,
                    message: "Staff not found"
                });
            }

            await staff.destroy();

            return res.status(200).json({
                success: true,
                message: "Staff deleted successfully"
            })

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete staff"
            })
        }
    },

    async getUser(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId, {
                attributes: ["id", "name", "email", "mobileNumber", "gender", "address", "role", "profile", "profileContentType"]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const userData = {
                ...user.toJSON(),
                profile: user.profile ? `data:${user.profileContentType};base64,${user.profile.toString("base64")}`
                    : null
            };

            return res.status(200).json({
                success: true,
                message: "User details fetched successfully",
                data: userData
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message: "Failed to get user details"
            });
        }
    },

    async updateUser(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;

            const { name, email, mobileNumber, gender, address, role } = req.body;

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            if (userRole === "ADMIN") {
                user.name = name ?? user.name;
                user.email = email ?? user.email;
                user.mobileNumber = mobileNumber ?? user.mobileNumber;
                user.gender = gender ?? user.gender;
                user.address = address ?? user.address;
                user.role = role ?? user.role;

                if (req.file) {
                    user.profile = req.file.buffer;
                    user.profileContentType = req.file.mimetype;
                }

            } else {
                if (req.file) {
                    user.profile = req.file.buffer;
                    user.profileContentType = req.file.mimetype;
                } else {
                    return res.status(403).json({
                        success: false,
                        message: "Only admins can update personal details. You can only update your profile image."
                    });
                }
            }

            await user.save();

            const userData = {
                ...user.toJSON(),
                profile: user.profile
                    ? `data:${user.profileContentType};base64,${user.profile.toString("base64")}`
                    : null
            };

            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: userData
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update user details"
            });
        }
    },

    async getPickupPersons(req, res) {
        try {
            const pickupPersons = await User.findAll({
                where: { role: "DELIVERY_ASSOCIATE" },
                attributes: ["id", "name", "email", "mobileNumber"]
            });

            return res.status(200).json({
                success: true,
                message: "Pickup person list fetched successfully",
                data: pickupPersons
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch pickup persons list"
            })
        }
    },

    //for customers

    //only for customer
    async updateMyProfile(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;

            if (userRole !== "CUSTOMER") {
                return res.status(403).json({
                    success: false,
                    message: "Only customers can update their own profile."
                });
            }

            const { name, email, mobileNumber, gender, address } = req.body;

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const existingUser = await User.findOne({
                where: {
                    email,
                    id: {[Op.ne]: userId,},
                    role: "CUSTOMER"
                },
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists.",
                });
            }


            user.name = name ?? user.name;
            user.email = email ?? user.email;
            user.mobileNumber = mobileNumber ?? user.mobileNumber;
            user.gender = gender ?? user.gender;
            user.address = address ?? user.address;

            if (req.file) {
                user.profile = req.file.buffer;
                user.profileContentType = req.file.mimetype;
            }

            await user.save();

            const userData = {
                ...user.toJSON(),
                profile: user.profile
                    ? `data:${user.profileContentType};base64,${user.profile.toString("base64")}`
                    : null
            };

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: userData
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update profile"
            });
        }
    },

    async customerChangePassword(req, res) {
        try {
            const userId = req.user.id;

            const { oldPassword, newPassword, confirmPassword } = req.body;

            if (!oldPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Old ,new and confirm password are required"
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "New password and confirm password do not match"
                });
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Old password is incorrect",
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await user.update({ password: hashedPassword });

            res.status(200).json({
                success: true,
                message: "Password changed successfully"
            });

        } catch (error) {
            return res.status(200).json({
                success: true,
                message: "Failed to change password"
            })
        }
    },

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                })
            }

            const resetToken = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1h"
                }
            );
            console.log(
                `${process.env.CLIENT_EMAIL_URL}/reset-password/${resetToken}`
            );

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Password reset request",
                html: `<p>You requested for a password reset. Click <a href="${process.env.CLIENT_EMAIL_URL}/reset-password/${resetToken}">here</a> to reset your password. The link will expire in 1 hour.</p>`
            }

            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                success: true,
                message: "Password reset email sent successfully",
                token: resetToken
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to send reset link"
            })
        }
    },

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Token and new password are required"
                });
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired reset token"
                });
            }

            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await user.update({ password: hashedPassword });

            return res.status(200).json({
                success: true,
                message: "Password reset successfully"
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to reset password"
            });
        }
    },

}

module.exports = authController;
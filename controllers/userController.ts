import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as base64 from 'node-base64-image';
import * as fs from 'fs';

import config from '../config/config';

import User from '../models/user.model';
import Parent from '../models/parent.model';
import Student from '../models/student.model';
import Teacher from '../models/teacher.model';
import Counsellor from '../models/counsellor.model';
import TransportManager from '../models/transportManager.model';
import FinanceManager from '../models/financeManager.model';
import Principal from '../models/principal.model';

import BaseController from './baseController';

export default class UserController extends BaseController {

    model = User;
    SALT_WORK_FACTOR = 10;

    //get by id
    get = (req, res) => {

        console.log('[UsersController] get, id: [' + req.params.id + ']');

        this.model.findOne({ _id: req.params.id })
        .populate('profile')
        .exec((err, obj) => {
            if (err) { return console.error(err); }
            res.json({
                'success': true,
                'data': obj
            });
        });
    }

    // Get by email
    getUser = (req, callback) => {
        console.log('[UsersController] getUser by email');
        console.log('User Email is '+req.body.email);
        this.model.findOne({ email: req.body.email }, callback);
        //this.model.findOne({ email: req.body.email }, callback).select('+password');
    }

    getUserByToken = (req, res) => {
        console.log('[UsersController] getUserByToken');
        this.model.findOne({ _id: req.userId })
        .populate('profile')
        .exec((err, obj) => {
            if (err) {
                res.status(500).json({
                    'success': false,
                    'message': 'Not found user'
                });
                return console.error(err);
            }
            res.json({
                'success': true,
                'data': obj
            });
        });
    }

    updateUserByToken = (req, res) => {
        this.model.findOneAndUpdate({ _id: req.userId }, req.body, (err) => {
            if (err) {
                res.status(500).json({
                    'success': false,
                    'message': 'Not found user'
                });
                return console.error(err);
            }
            res.status(200).json({
                'success': true,
                'userID': req.userId
            });
        });
    }

    resetPassword = (req, res) => {
        // generate a salt
        bcrypt.genSalt(this.SALT_WORK_FACTOR, (err, salt) => {
            if (err) {
                res.status(500).json({
                    'success': false,
                    'message': 'Encrypt generate error'
                });
                return console.error(err);
            }

            // hash the password using our new salt
            bcrypt.hash(req.body.password, salt, (err1, hash) => {
                if (err1) {
                    res.status(500).json({
                        'success': false,
                        'message': 'Password encrypt error'
                    });
                    return console.error(err1);
                }

                // override the cleartext password with the hashed one
                req.body.password = hash;
                this.updateUserByToken(req, res);
            });
        });
    }

    addUser = (req, res) => {
        console.log("(addUser) requested data "+JSON.stringify(req.body))               
         if(req.body.role == "STUDENT"){  

             if (req.body.img) {

                var buff = new Buffer(req.body.img.value
                .replace(/^data:image\/(png|gif|jpeg|jpg);base64,/,''), 'base64');
                var file = './public/uploads/'+ req.body.img.filename
                var image = '/uploads/'+ req.body.img.filename
                console.log("Image "+image);
                fs.writeFile(file, buff, function (err) {
                console.log('error' + err);
                    });
                }

            const obj = new User({
                email: req.body.mother_email,
                password: req.body.password,
                role: req.body.role,
                img:image
            });
        }
          
        else  {
            const obj = new User({
                email: req.body.email,
                password: req.body.password,
                role: req.body.role,
                img:image

            });
        }
            obj.save((err, savedUser) => {
            
            if (err) {
                res.status(400).json({
                    'success': false,
                    'code': err.code,
                    'error': err.errmsg
                });
                return console.error(err);
            }

            const payload = {
                id: savedUser._id
            };

            const token = jwt.sign(payload, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });

            if(req.body.role == "STUDENT"){
                const p = Parent({
                    user: savedUser._id,
                    mother_name: req.body.mother_name,
                    mother_email: req.body.mother_email,
                    mother_mob_no: req.body.mother_mob_no,
                    mother_tel_no: req.body.mother_tel_no,
                    father_name: req.body.father_name,
                    father_email: req.body.father_email,
                    father_mob_no: req.body.father_mob_no,
                    father_tel_no: req.body.father_tel_no,

                });

                p.save((err, savedParent) => {
                    if (err) {
                        res.status(400).json({
                            'success': false,
                            'code': err.code,
                            'error': err.errmsg
                        });
                        return console.error(err);
                    }

                    const s = new Student({
                        parent: savedParent._id,
                        name: req.body.name,
                        gender: req.body.gender,
                        lib_no: req.body.lib_no,
                        standard: req.body.standard,
                        section: req.body.section,
                        dob: req.body.dob,
                        doj: req.body.doj,
                        previous_school: req.body.previous_school,
                        aadhar_id: req.body.aadhar_id,
                    });
                    s.save((err, savedStudent) => {

                        if (err) {
                            res.status(400).json({
                                'success': false,
                                'code': err.code,
                                'error': err.errmsg
                            });
                            return console.error(err);
                        }

                        res.status(200).json({
                            'success': true,
                            'token': token,
                            'userID': savedUser._id,

                        });
                    });//s.save
                
                }); // p.save
                
                
            } // if (student)

            else if(req.body.role == "TEACHER"){
                const teacher = Teacher({
                    user: savedUser._id,
                    name: req.body.name,
                    dob: req.body.dob,
                    doj: req.body.doj,
                    marital_status: req.body.marital_status,
                    tel_no: req.body.tel_no,
                    father_name: req.body.father_name,
                    education: req.body.education,
                    work_exp: req.body.work_exp,
                    bank_name: req.body.bank_name,
                    bank_acc_no: req.body.bank_acc_no,
                    aadhar_id: req.body.aadhar_id,
                    address: req.body.address,

                });

                teacher.save((err, savedTeacher) => {
                    if (err) {
                        res.status(400).json({
                            'success': false,
                            'code': err.code,
                            'error': err.errmsg
                        });
                        return console.error(err);
                    }

                    res.status(200).json({
                        'success': true,
                        'token': token,
                        'userID': savedUser._id,
                    });
                }); // teacher.save
            } //else  if (teacher)

            else if(req.body.role == "COUNSELLOR"){
                const c = Counsellor({
                    user: savedUser._id,
                    name: req.body.name,
                    dob: req.body.dob,
                    doj: req.body.doj,
                    marital_status: req.body.marital_status,
                    tel_no: req.body.tel_no,
                    father_name: req.body.father_name,
                    education: req.body.education,
                    work_exp: req.body.work_exp,
                    bank_name: req.body.bank_name,
                    bank_acc_no: req.body.bank_acc_no,
                    aadhar_id: req.body.aadhar_id,
                    address: req.body.address,

                });

                c.save((err, savedCounsellor) => {
                    if (err) {
                        res.status(400).json({
                            'success': false,
                            'code': err.code,
                            'error': err.errmsg
                        });
                        return console.error(err);
                    }

                    res.status(200).json({
                        'success': true,
                        'token': token,
                        'userID': savedUser._id,
                    });
                }); // c.save
            } //else  if (counsellor)

            else if(req.body.role == "TRANSPORT-MANAGER"){
                const t = TransportManager({
                    user: savedUser._id,
                    name: req.body.name,
                    dob: req.body.dob,
                    doj: req.body.doj,
                    marital_status: req.body.marital_status,
                    tel_no: req.body.tel_no,
                    father_name: req.body.father_name,
                    education: req.body.education,
                    work_exp: req.body.work_exp,
                    bank_name: req.body.bank_name,
                    bank_acc_no: req.body.bank_acc_no,
                    aadhar_id: req.body.aadhar_id,
                    address: req.body.address,

                });

                t.save((err, savedTransportManager) => {
                    if (err) {
                        res.status(400).json({
                            'success': false,
                            'code': err.code,
                            'error': err.errmsg
                        });
                        return console.error(err);
                    }

                    res.status(200).json({
                        'success': true,
                        'token': token,
                        'userID': savedUser._id,
                    });
                }); // t.save
            } //else  if (transport-manager)

             else if(req.body.role == "FINANCE-MANAGER"){
                const f = FinanceManager({
                    user: savedUser._id,
                    name: req.body.name,
                    dob: req.body.dob,
                    doj: req.body.doj,
                    marital_status: req.body.marital_status,
                    tel_no: req.body.tel_no,
                    father_name: req.body.father_name,
                    education: req.body.education,
                    work_exp: req.body.work_exp,
                    bank_name: req.body.bank_name,
                    bank_acc_no: req.body.bank_acc_no,
                    aadhar_id: req.body.aadhar_id,
                    address: req.body.address,

                });

                f.save((err, savedFinanceManager) => {
                    if (err) {
                        res.status(400).json({
                            'success': false,
                            'code': err.code,
                            'error': err.errmsg
                        });
                        return console.error(err);
                    }

                    res.status(200).json({
                        'success': true,
                        'token': token,
                        'userID': savedUser._id,
                    });
                }); // f.save
            } //else  if (finance-manager)

            else if(req.body.role == "PRINCIPAL"){
                const p = Principal({
                    user: savedUser._id,
                    name: req.body.name,
                    dob: req.body.dob,
                    doj: req.body.doj,
                    marital_status: req.body.marital_status,
                    tel_no: req.body.tel_no,
                    father_name: req.body.father_name,
                    education: req.body.education,
                    work_exp: req.body.work_exp,
                    bank_name: req.body.bank_name,
                    bank_acc_no: req.body.bank_acc_no,
                    aadhar_id: req.body.aadhar_id,
                    address: req.body.address,

                });

                p.save((err, savedPrincipal) => {
                    if (err) {
                        res.status(400).json({
                            'success': false,
                            'code': err.code,
                            'error': err.errmsg
                        });
                        return console.error(err);
                    }

                    res.status(200).json({
                        'success': true,
                        'token': token,
                        'userID': savedUser._id,
                    });
                }); // p.save
            } //else  if (principal)

        }); // obj.save

    } // addUser



    setGeneralInformation = (req, res) => {
        const obj = new this.model(req.body);
        obj.save((err, item) => {
            if (err) {
                res.status(400).json({
                    'success': false,
                    'code': err.code,
                    'error': err.errmsg
                });
                return console.error(err);
            }

            const payload = {
                id: item._id
            };

            const token = jwt.sign(payload, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });

            res.status(200).json({
                'success': true,
                'token': token,
                'userID': item._id
            });
        });
    }

     //get profile image by userid
    getProfileImage = (req, res) => { 
        
        console.log('[UsersController] getProfileImage, id: [' + req.params.id + ']');

        this.model.findOne({ _id: req.params.id })
        .populate('users')
        .exec((err, user) => {
            if (err) { return console.error(err); }
            var imgUrl = user.img;
            console.log("Image ",imgUrl);
            res.sendfile(imgUrl);
        });
       
    }//getProfileImage   
}

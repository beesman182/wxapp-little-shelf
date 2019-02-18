//app.js
const api = require('./config/config.js');

App({
  // 小程序启动生命周期
  onLaunch: function () {
    let that = this;
    // 检查登录状态
    that.checkLoginStatus();
  },

  // 检查本地 storage 中是否有登录态标识
  checkLoginStatus: function () {
    let that = this;
    let loginFlag = wx.getStorageSync('loginFlag');
    if (loginFlag) {
      // 检查 session_key 是否过期
      wx.checkSession({
        // session_key 有效(未过期)
        success: function () {
          // 直接从Storage中获取用户信息
          let userStorageInfo = wx.getStorageSync('userInfo');
          if (userStorageInfo) {
            that.globalData.userInfo = JSON.parse(userStorageInfo);
          } else {
            that.showInfo('缓存信息缺失');
            console.error('登录成功后将用户信息存在Storage的userStorageInfo字段中，该字段丢失');
          }

        },
        // session_key 过期
        fail: function () {
          // session_key过期
          that.showInfo('亲，当前未登录')
        }
      });
    } else {
      // 无登录态
      that.showInfo('亲，当前未登录')
    }
  },

  // 登录
  login: function (infoRes, callback = () => {}) {
    let that = this;
    wx.login({
      success: function (loginRes) {
        if (loginRes.code) {
          // 请求服务端的登录接口
          wx.request({
            url: api.loginUrl,
            data: {
              code: loginRes.code, // 临时登录凭证
              rawData: infoRes.rawData, // 用户非敏感信息
              signature: infoRes.signature, // 签名
              encryptedData: infoRes.encryptedData, // 用户敏感信息
              iv: infoRes.iv // 解密算法的向量
            },
            success: function (res) {
              res = res.data;
              if (res.result == 0) {
                that.globalData.userInfo = res.userInfo;
                wx.setStorageSync('userInfo', JSON.stringify(res.userInfo));
                wx.setStorageSync('loginFlag', res.skey);
                callback();
              } else {
                that.showInfo(res.errmsg);
              }
            },
            fail: function (error) {
              // 调用 服务端登录接口 失败
              that.showInfo('调用服务端登录接口失败');
            }
          })
        } else {
          // 获取 code 失败
          that.showInfo('登录失败');
        }
      },
      fail: function (error) {
        // 调用 wx.login 接口失败
        that.showInfo('调用wx.login接口失败');
      }
    });
  },

  // // 检查用户信息授权设置
  // checkUserInfoPermission: function (callback = () => {}) {
  //   wx.getSetting({
  //     success: function (res) {
  //       if (!res.authSetting['scope.userInfo']) {
  //         wx.openSetting({
  //           success: function (authSetting) {
  //             console.log(authSetting)
  //           }
  //         });
  //       }
  //     },
  //     fail: function (error) {
  //       console.log(error);
  //     }
  //   });
  // },


  // 获取用户登录标示 供全局调用
  getLoginFlag: function () {
    return wx.getStorageSync('loginFlag');
  },


  // 封装 wx.showToast 方法
  showInfo: function (info = 'error', icon = 'none') {
    wx.showToast({
      title: info,
      icon: icon,
      duration: 1500,
      mask: true
    });
  },

  // 获取书籍已下载路径
  getDownloadPath: function (key) {
    return wx.getStorageSync(key);
  },

  // 调用 wx.saveFile 将下载的文件保存在本地
  // 本地文件存储的大小限制为 10M
  saveDownloadPath: function (key, filePath) {
    return new Promise((resolve, reject) => {
      wx.saveFile({
        tempFilePath: filePath,
        success: function (res) {
          // 保存成功 在Storage中标记 下次不再下载
          let savedFilePath = res.savedFilePath;
          wx.setStorageSync(key, savedFilePath);
          resolve(savedFilePath);
        },
        fail: function () {
          reject(false);
        }
      });
    })

  },

  // 打开书籍
  openBook: function (filePath) {
    wx.openDocument({
      filePath: filePath,
      success: function (res) {
        console.log('打开文档成功')
      },
      fail: function (error) {
        console.log(error);
      }
    });
  },
  // app全局数据
  globalData: {
    userInfo: null
  }
});
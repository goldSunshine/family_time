var that = this
const db=wx.cloud.database()
var util = require('../../utils/utils.js')

//使用腾讯地图需要的插件
var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var qqmapsdk;

Page({
  data: {
    formats: {},
    readOnly: false,
    placeholder: '这一刻想写下...',
    editorHeight: 300,
    keyboardHeight: 0,
    isIOS: true,
    content:"",
    publish:false,
    address:"",
    userinfo:""
  },
  
  readOnlyChange() {
    this.setData({
      readOnly: !this.data.readOnly
    })
  },
  onLoad() {
    //rich_editer富文本编辑的基本配置
    const platform = wx.getSystemInfoSync().platform
    const isIOS = platform === 'ios'
    this.setData({ isIOS })
    that = this
    this.updatePosition(0)
    let keyboardHeight = 0
    wx.onKeyboardHeightChange(res => {
      if (res.height === keyboardHeight) return
      const duration = res.height > 0 ? res.duration * 1000 : 0
      keyboardHeight = res.height
      setTimeout(() => {
        wx.pageScrollTo({
          scrollTop: 0,
          success() {
            that.updatePosition(keyboardHeight)
            that.editorCtx.scrollIntoView()
          }
        })
      }, duration)

    })
    qqmapsdk = new QQMapWX({
      key: 'XDSBZ-W7YKD-YEI47-PDTZ4-V3GEJ-JKB3H' //这里自己的key秘钥进行填充
    });

    //地理位置授权
    that.getUserAuth()

    //获取用户信息
    wx.getUserInfo({
      success: function (res) {
        that.setData({
          userinfo:res.userInfo
        })
      }
    })
  
  },
  updatePosition(keyboardHeight) {
    const toolbarHeight = 50
    const { windowHeight, platform } = wx.getSystemInfoSync()
    let editorHeight = keyboardHeight > 0 ? (windowHeight - keyboardHeight - toolbarHeight) : windowHeight
    this.setData({ editorHeight, keyboardHeight })
  },
  calNavigationBarAndStatusBar() {
    const systemInfo = wx.getSystemInfoSync()
    const { statusBarHeight, platform } = systemInfo
    const isIOS = platform === 'ios'
    const navigationBarHeight = isIOS ? 44 : 48
    return statusBarHeight + navigationBarHeight
  },
  onEditorReady() {
    const that = this
    wx.createSelectorQuery().select('#editor').context(function (res) {
      that.editorCtx = res.context
    }).exec()
  },
  blur() {
    this.editorCtx.blur()
  },
  format(e) {
    let { name, value } = e.target.dataset
    if (!name) return
    // console.log('format', name, value)
    this.editorCtx.format(name, value)

  },
  onStatusChange(e) {
    const formats = e.detail
    this.setData({ formats })
  },
  insertDivider() {
    this.editorCtx.insertDivider({
      success: function () {
        console.log('insert divider success')
      }
    })
  },
  clear() {
    this.editorCtx.clear({
      success: function (res) {
      }
    })
  },
  removeFormat() {
    this.editorCtx.removeFormat()
  },
  insertDate() {
    const date = new Date()
    const formatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    this.editorCtx.insertText({
      text: formatDate
    })
  },
  insertImage() {
    const that = this
    //上传图片，将图片选中并且上传到云存储中。
    wx.chooseImage({
      count: 9,
      success: function (res) {
        for (var x in res.tempFilePaths){   
        console.log(res.tempFilePaths[x]),        
        wx.cloud.uploadFile({
            cloudPath: new Date().getTime() + '.png', // 上传至云端的路径
            filePath: res.tempFilePaths[x], // 小程序临时文件路径
            success: res => {
              // 返回文件 ID，使用返回的id显示到编辑页面中
              that.editorCtx.insertImage({
                src: res.fileID,
                width: '100%',
                success: function () {
                }
              })
            },
            fail: console.error
          })

     
        }
      }
    })
  },
  setConfirm: function (e) {
    that.editorCtx.getContents({
      success: function (res) {
        var content = {
          html: res.html,
          text: res.text,
          delta: res.delta,
        }
      
        if(that.data.publish){
          var data={
            content: content.html,
            time: util.formatTime(new Date),
            status: that.data.publish,
            address: that.data.address,
            userinfo: that.data.userinfo      
          }
        }else{
          var data = {
            content: content.html,
            time: util.formatTime(new Date),
            status: that.data.publish,
            address: that.data.address
          }
        }
        console.log(data);
        db.collection('two').add({
          data:data,
          success:res=>{
            console.log('clear')
            that.clear()
            wx.switchTab({url: '../show/show',})
          }
        })
      }
    })
  },
  setClear: function(e){
    this.clear()
  },
  onReachBottom: function (){
    consolee.log('下拉')
  },
  onPullDownRefresh: function () {
    console.log("上拉")
  },
  publishContext:function(e){
  
    if (e.detail.value){
      that.setData({
        publish:true
      })
    }else{
      that.setData({
        publish: false
      })
    }
    console.log('switch类型开关当前状态-----', that.data.publish);
  },
  getUserAuth:function(){
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
          wx.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: function (res) {
              if (res.cancel) {
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (res.confirm) {
                wx.openSetting({
                  success: function (dataAu) {
                    if (dataAu.authSetting["scope.userLocation"] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API

                    } else {
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] == undefined) {
          //调用wx.getLocation的API
          that.getLocation()
        }
        else {
          //调用wx.getLocation的API
          that.getLocation()
        }
      }
    })
  },
  getLocation: function () {
    let that = this;
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        that.getLocal(res.latitude, res.longitude)
      },
      fail: function (res) {
      }
    })
  },
  
//-------------------------------------

  getLocal: function (latitude, longitude) {
    let vm = this;
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: function (res) {
        var address = res.result.address
        vm.setData({
          address: address
        })
      },
      fail: function (res) {
      },
      complete: function (res) {
      }
    });
  }
//------------------------------------- 

})

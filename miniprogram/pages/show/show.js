// pages/show/show.js
var that = this
//想要使用云数据库，首先需要申明
const db = wx.cloud.database()

Page({
  data: {
    content:[],
    openid:"",
    windowHeight:"",
    windowWidth:"",
    hidden:true,
    totalCount:0,
    pageSize:10,
    pageIndex:1,
    hasMoreData:true,
    five_time:0,
    botton_image:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onload")
    that = this
    //手机的屏幕尺寸大小不一致，获取手机的尺寸大小做到全屏显示
    wx.getSystemInfo({
      success: function (res) {
        // 屏幕宽度、高度 单位为px
        that.setData({
          windowHeight: res.windowHeight,
          windowWidth: res.windowWidth
        })
      }
    })    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("onready")
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("onshow")
    that.getOpenid(); 
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  getOpenid:function() {
    wx.cloud.callFunction({
      name: 'openapi',
      complete: res => {
        that.setData({
          openid: res.result.openId,
          pageIndex:1
        })
        that.getData()
        that.getTotalNum()
      }
    })
  },
  
  //第一次获取数据
  getData:function() {
    //云开发数据库查询
    db.collection("two")
    .where(db.command.or({ _openid: that.data.openid }, { status: true }))
    .limit(that.data.pageSize)
    .orderBy("time", "desc")
      .get({
        success: function (res) {
          that.setData({
            content: res.data,
            hidden: true
          })
          if (that.data.content.length >= that.data.totalCount) {
            that.setData({
              hasMoreData: false
            })
          }
        }
      })
  },
  //获取数据库中记录总个数
  getTotalNum:function(){
    db.collection('two')
      .where({ _openid: that.data.openid })
      .count({
        success: function (res) {
          that.data.totalCount = res.total;
        }
      })
  },
  //下拉到底部之后获取数据
  getMoreData:function(){
    var offest_num = that.data.pageSize * that.data.pageIndex
    db.collection("two")
      .where(db.command.or({ _openid: that.data.openid },{status:true}))
      .skip(offest_num)
      .limit(that.data.pageSize)
      .orderBy("time", "desc")
      .get({
        success: function (res) {
          that.setData({
            content: that.data.content.concat(res.data),
            pageIndex: that.data.pageIndex + 1,
            hidden: true
          })

          console.log(that.data.content)
          console.log(that.data.content.length)
          if (that.data.content.length >= that.data.totalCount) {
            that.setData({
              hasMoreData: false
            })
          }
        }
      })
  
  },

  //上拉触发函数
  topLoad:function(){
    that.setData({
      hidden: false
    })
    that.getData()
  },
  //下发触发函数
  bindDownLoad: function () {  
    that.setData({
      hidden: false
    });
    that.getMoreData()
  }

})
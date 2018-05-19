const MENU_WIDTH_SCALE = 0.82;
const FAST_SPEED_SECOND = 300;
const FAST_SPEED_DISTANCE = 5;
const FAST_SPEED_EFF_Y = 50;
var app = getApp()
var WxParse = require('../../tool/wxParse/wxParse.js');
const regeneratorRuntime =require("../../tool/regeneratorRuntime.js")
Page({
  data: {
    ui: {
      windowWidth: 0,
      menuWidth: 0,
      offsetLeft: 0,
      tStart: true
    },
    navList:[],
    twoClassShow:"",
    breadcast:[],
    articleData:[],
    showArticleData:[],
    contentType:"list"
  },
  onLoad() {
    this.getData()
    try {
      let res = wx.getSystemInfoSync()
      this.windowWidth = res.windowWidth;
      this.data.ui.menuWidth = this.windowWidth * MENU_WIDTH_SCALE;
      this.data.ui.offsetLeft = 0;
      this.data.ui.windowWidth = res.windowWidth;
      this.setData({ 
        ui: this.data.ui ,
        breadcast:[{name:"推荐列表",id:""}]
      })
    } catch (e) {
    }
  },
  getData(){
    
    try {
      // var navData = wx.getStorageSync('navData')
      // var articleData = wx.getStorageSync('articleData')
      if (false) {
        this.setData({
          navList:JSON.parse(navData),
          articleData: JSON.parse(articleData)
        })
      }else{
        this.getDataAll().then((data)=>{
          // wx.setStorage({
          //   navData: JSON.stringify(data.navData.data.data),
          //   articleData: JSON.stringify(data.navData.data.articleData)
          // })
          console.log(data.articleData.data.data)
          this.setData({
            navList: data.navData.data.data,
            articleData: data.articleData.data.data,
            showArticleData: data.articleData.data.data.filter((i)=>{
              return i.recommend==1
            })
          })
        })
      }
    } catch (e) {
      // Do something when catch error
      this.getDataAll().then((data) => {
        // wx.setStorage({
        //   navData: JSON.stringify(data.navData.data.data),
        //   articleData: JSON.stringify(data.navData.data.articleData)
        // })
        this.setData({
          navList: data.navData.data.data,
          articleData: data.articleData.data.data
        })
      })
    }
     
  },
  // 异步请求数据
  async getDataAll(){
    let navData = await this.getDataPromise({ url: "https://miniapp.chenyuanguang.cn/api/front/miniApp/getNav", method: "get", data: {} })
      let articleData = await this.getDataPromise({ url: "https://miniapp.chenyuanguang.cn/api/front/miniApp/getArticleAll", method: "get", data: {} })

      return { navData, articleData }
  },
  // 封装promise异步数据请求
  getDataPromise(obj){
    let { url, method,data}=obj
    return new Promise((resolve,reject)=>{
      wx.request({
        url: url,
        header: {
          'content-type': 'application/json' // 默认值
        },
        data,
        method,
        success: (res) => {
          // console.log(res.data)
          resolve(res)
         
        }
      })
    })
   
  },
  handlerStart(e) {
    let { clientX, clientY } = e.touches[0];
    this.tapStartX = clientX;
    this.tapStartY = clientY;
    this.tapStartTime = e.timeStamp;
    this.startX = clientX;
    this.data.ui.tStart = true;
    this.setData({ ui: this.data.ui })
  },
  handlerMove(e) {
    let { clientX } = e.touches[0];
    let { ui } = this.data;
    let offsetX = this.startX - clientX;
    this.startX = clientX;
    ui.offsetLeft -= offsetX;
    if (ui.offsetLeft <= 0) {
      ui.offsetLeft = 0;
    } else if (ui.offsetLeft >= ui.menuWidth) {
      ui.offsetLeft = ui.menuWidth;
    }
    this.setData({ ui: ui })
  },
  handlerCancel(e) {
    // console.log(e);
  },
  handlerEnd(e) {
    this.data.ui.tStart = false;
    this.setData({ ui: this.data.ui })
    let { ui } = this.data;
    let { clientX, clientY } = e.changedTouches[0];
    let endTime = e.timeStamp;
    //快速滑动
    if (endTime - this.tapStartTime <= FAST_SPEED_SECOND) {
      //向左
      if (this.tapStartX - clientX > FAST_SPEED_DISTANCE) {
        ui.offsetLeft = 0;
      } else if (this.tapStartX - clientX < -FAST_SPEED_DISTANCE && Math.abs(this.tapStartY - clientY) < FAST_SPEED_EFF_Y) {
        ui.offsetLeft = ui.menuWidth;
      } else {
        if (ui.offsetLeft >= ui.menuWidth / 2) {
          ui.offsetLeft = ui.menuWidth;
        } else {
          ui.offsetLeft = 0;
        }
      }
    } else {
      if (ui.offsetLeft >= ui.menuWidth / 2) {
        ui.offsetLeft = ui.menuWidth;
      } else {
        ui.offsetLeft = 0;
      }
    }
    this.setData({ ui: ui })
  },
  handlerPageTap(e) {
    let { ui } = this.data;
    if (ui.offsetLeft != 0) {
      ui.offsetLeft = 0;
      this.setData({ ui: ui })
    }
  },
  handlerAvatarTap(e) {
    let { ui } = this.data;
    if (ui.offsetLeft == 0) {
      ui.offsetLeft = ui.menuWidth;
      this.setData({ ui: ui })
    }
  },
  goshow(e){
   
    this.setData({
      twoClassShow: e.currentTarget.dataset.oneid
    })
     
  },
  // 侧边栏消失
  gohide(e){
    let { ui } = this.data;
    ui.offsetLeft=0;
    this.setData({
      ui
    })
    this.getClass(e.currentTarget.id)
    console.log(e.currentTarget.id)
  },
// 获取二级分类对应的一级分类
  getClass(twoId){
    let arr = [{ name: "首页", id: "" }]
    console.log(this.data.navList)
    
    this.data.navList.forEach((i)=>{
        i.twodata.forEach((j)=>{
          if (j.id == twoId){

            arr.push({ name: i.onedata.cnname, id: i.onedata.id,type:"one"})
            arr.push({ name: j.cnname, id: j.id,type:"two" })
          
          }
        })
    })
    this.setData({
      breadcast:arr
    })
    this.filterShowData({type:"twoId", id:twoId})
  },
  // 根据分类做数据筛选
  filterShowData(obj){
    let {type,id}=obj
    this.setData({
      showArticleData: this.data.articleData.filter((i)=>{
            if(type=="oneId"){
              return i.oneId==id
            }else{
              return i.twoId==id
            }
      })
    })
  },
  // 面包屑，根据一二级分类筛选数据
  filterArticle(e){
    this.setData({
      contentType: "list"
    })
    let {type,name,id}= e.currentTarget.dataset.item
    if(type=="one"){
      let arr = [{ name: "首页", id: "" }]
      arr.push({ name, id,type})
      this.setData({
        breadcast: arr
      })
      this.filterShowData({ type:"oneId",id:id})
    } else if (type == "two"){
      this.getClass(id)
    }else{
      let arr = [{ name: "首页", id: "" }]
      this.setData({
        breadcast: arr,
        showArticleData: this.data.articleData
      })
    }
  },
  goDetail(e){
    let { content, twoId } = e.currentTarget.dataset.item
    WxParse.wxParse('content', 'html', content, this, 5);
    this.setData({
      contentType:"detail"
    })
    this.getClass(twoId)
  }
})
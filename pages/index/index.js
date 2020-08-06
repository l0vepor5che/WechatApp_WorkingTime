//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    totalWorkDayIndex: 4,
    totalWorkDayArray: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    workDurationArray: [{
      id: 1,
      title: "第1日在岗时长",
      duration: ""
    }],
    goToWorkTime: "08:00",
    requiredWorkingHours: 8.25,
    remainingWorkingHours: 0,
    getOffWorkTime: ''
  },


  //事件处理函数
  onLoad: function () {
    this.updateworkDurationArray();
  },

  //每日规定时长改变后触发
  inputWorkingHourChanged: function (e) {
    //this.calcGetOffTimeResult();
  },

  //本周工作天数改变后触发
  totalWorkDayChanged: function (e) {
    this.setData({
      totalWorkDayIndex: e.detail.value
    });
    this.updateworkDurationArray();
  },

  //更改workDurationArray(通过totalWorkDayIndex的数量来判断需要显示多少行的时长)
  updateworkDurationArray: function () {
    var wdArray = new Array;
    var totalRecord = parseInt(this.data.totalWorkDayIndex);
    for (var i = 1; i <= totalRecord; i++) {
      var object = {
        id: i.toString(),
        title: "第" + i.toString() + "日在岗时长",
        duration: ""
      };
      wdArray.push(object);
    }
    this.setData({
      workDurationArray: wdArray
    });
  },

  //每日的在岗时长改变后触发
  dayWorkingHoursChanged: function (e) {
    var theItem = "workDurationArray[" + (parseInt(e.currentTarget.dataset.index) - 1) + "].duration"; //先用一个变量，把(Array[0].value)用字符串拼接起来
    this.setData({
      [theItem]: e.detail.value
    })
  },

  //今日上班时间改变后触发
  bindTimeChange: function (e) {
    this.setData({
      time: e.detail.value
    })
  },

  //点击按钮后触发，计算剩余时长和下班时间结果
  calcGetOffTimeResult: function () {
    //goToWorkTime
    //workDurationArray: [{ id: 1, title: "第1日在岗时长", duration: ""}]
    var requiredHours = this.data.requiredWorkingHours;
    var wdArray = this.data.workDurationArray;
    var todayGoToWorkTime = this.data.goToWorkTime;
    var earningHours = 0;
    for (var i = 0; i < wdArray.length; i++) {
      var dur = wdArray[i].duration;
      if (parseFloat(dur) > 0) earningHours = parseFloat(earningHours) + parseFloat(dur) - parseFloat(requiredHours);
    }

    var resultRemainingHours = (parseFloat(requiredHours) - parseFloat(earningHours)).toFixed(2);

    var startTime = new Date();
    startTime.setHours(8);
    startTime.setMinutes(0);
    var tmp = startTime.getTime();
    console.log("tmp Before:" + tmp);
    tmp = parseInt(tmp) + parseFloat(resultRemainingHours) * 3600 * 1000;
    console.log("tmp After:" + tmp);
    var endTime = new Date(tmp);
    var strEndTime = this.PrefixInteger(parseInt(endTime.getHours()), 2) + ":" + this.PrefixInteger(parseInt(endTime.getMinutes()), 2);
    console.log(strEndTime);

    this.setData({
      remainingWorkingHours: resultRemainingHours,
      getOffWorkTime: strEndTime
    })
  },

  // num传入的数字，n需要的字符长度
  PrefixInteger: function (num, n) {
    return (Array(n).join(0) + num).slice(-n);
  }

})
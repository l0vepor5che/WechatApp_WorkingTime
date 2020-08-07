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
    goToWorkTime: "08:30",
    requiredWorkingHours: 8.25,
    remainingWorkingHours: "",
    getOffWorkTime: "",
    constEarliestOnDutyTime: "07:00",
    constLatestOnDutyTime: "09:30",
    constEarliestOffDutyTime: "15:30",
    constLatestOffDutyTime: "19:30",
    constMinHours: 0.01,
    constMaxHours: 13.0
  },


  //事件处理函数
  onLoad: function () {
    //记录缓存数据
    //每日规定时长
    var rqHours = wx.getStorageSync('rqHours');
    if (rqHours != "") {
      this.setData({
        requiredWorkingHours: rqHours
      })
    }
    //当日上班时间
    var gtwTime = wx.getStorageSync('gtwTime');
    if (gtwTime != "") {
      this.setData({
        goToWorkTime: gtwTime
      })
    }
    //本周工作天数和已完成工作时长
    var wkDaysIndex = wx.getStorageSync('wkDaysIndex');
    var wdArray = wx.getStorageSync('wdArray');
    if(wkDaysIndex !="" && wdArray != "" && wdArray.length == parseInt(wkDaysIndex)){
      this.setData({
        totalWorkDayIndex: wkDaysIndex
      });
      this.updateworkDurationArray();
      this.setData({
        workDurationArray: wdArray
      });
      this.calcGetOffTimeResult();
    }else{
      this.updateworkDurationArray();
    }
  },

  //每日规定时长改变后触发
  inputWorkingHourChanged: function (e) {
    this.setData({
      requiredWorkingHours: e.detail.value
    })
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
      workDurationArray: wdArray,
      remainingWorkingHours: "",
      getOffWorkTime: ""
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
      goToWorkTime: e.detail.value
    })
  },

  //点击按钮后触发，计算剩余时长和下班时间结果
  calcGetOffTimeResult: function () {
    var requiredHours = this.data.requiredWorkingHours;
    var wdArray = this.data.workDurationArray;
    var lsTodayTime = this.data.goToWorkTime.split(":");
    var todayTimeHour = lsTodayTime[0];
    var todayTimeMinute = lsTodayTime[1];
    var earningHours = 0;
    for (var i = 0; i < wdArray.length; i++) {
      var dur = wdArray[i].duration;
      //if (parseFloat(dur) > 0) earningHours = parseFloat(earningHours) + parseFloat(dur) - parseFloat(requiredHours);
      earningHours = parseFloat(earningHours) + parseFloat(dur) - parseFloat(requiredHours);
    }
    var resultRemainingHours = (parseFloat(requiredHours) - parseFloat(earningHours)); //计算出本周剩余时长

    //先判断之前输入的数据是否合法，如果不合法就直接弹窗提示，不用后续计算
    var isEffective = this.judgeInputsEffective(requiredHours, wdArray);
    if (isEffective != 0) return;

    //计算最终的下班时间，附带两种特殊情况（1、早于当日的最早下班时间； 2、晚于当日的最晚下班时间）
    var strResult = this.calcEffectiveOffDutyTime(todayTimeHour, todayTimeMinute, resultRemainingHours);
    this.setData({
      remainingWorkingHours: resultRemainingHours.toFixed(2),
      getOffWorkTime: strResult[1]
    })

    if (strResult[0] == 1) {
      wx.showToast({
        // title: "提示：" + "\r\n" + "本周工作时长不足！",
        title: "本周时长不足！",
        image: "../../images/toast_warning.png",
        duration: 2000
      })
    }

    //记录缓存数据
    wx.setStorage({
      key: "rqHours",
      data: this.data.requiredWorkingHours,
    })
    wx.setStorage({
      key: "wkDaysIndex",
      data: this.data.totalWorkDayIndex,
    })
    wx.setStorage({
      key: "wdArray",
      data: this.data.workDurationArray,
    })
    wx.setStorage({
      key: 'gtwTime',
      data: this.data.goToWorkTime,
    })
  },

  //判读输入的数据值是否合法
  judgeInputsEffective: function (rqHours, finArray) {
    var errMsg = "";
    var isEffective = 0;
    if (this.judgeRangeEffective(rqHours) != 0) {
      errMsg = "‘每日规定时长’值无效\n请重新输入！";
      isEffective = -1;
    } else {
      for (var i = 0; i < finArray.length; i++) {
        var dur = finArray[i].duration;
        if (this.judgeRangeEffective(dur) != 0) {
          errMsg = "'" + finArray[i].title + "＇值无效\n请重新输入！";
          isEffective = -1;
          break;
        }
      }
    }

    //如果其中有一个值无效，弹出modal提示用户
    if (isEffective != 0) {
      wx.showModal({
        title: "提示",
        content: errMsg,
        showCancel: false
      })
    }
    return isEffective;
  },

  //判断时长是否位于有效范围之内
  judgeRangeEffective: function (hours) {
    if (hours == "") return -1;
    if (parseFloat(hours) >= parseFloat(this.data.constMinHours) && parseFloat(hours) <= parseFloat(this.data.constMaxHours)) return 0;
    return -1;
  },

  //判断是否早于最早下班时间，或是否晚于最晚下班时间
  calcEffectiveOffDutyTime: function (onDutyTimeHour, onDutyTimeMinute, remainingHours) {
    //先判断是否有两种特殊情况(0代表正常，-1代表早于最早下班时间，1代表晚于最晚下班时间)
    var resultSituation = 0;
    var offDutytime2totalmins = parseInt(onDutyTimeHour) * 60 + parseInt(onDutyTimeMinute) + parseFloat(remainingHours) * 60;
    var earliestOffDutyTime2totalmins = parseInt(this.data.constEarliestOffDutyTime.split(":")[0]) * 60 + parseInt(this.data.constEarliestOffDutyTime.split(":")[1]);
    var latestOffDutyTime2totalmins = parseInt(this.data.constLatestOffDutyTime.split(":")[0]) * 60 + parseInt(this.data.constLatestOffDutyTime.split(":")[1]);
    if (parseInt(offDutytime2totalmins) < parseInt(earliestOffDutyTime2totalmins)) {
      return [-1, this.data.constEarliestOffDutyTime];
    } else if (parseInt(offDutytime2totalmins) > parseInt(latestOffDutyTime2totalmins)) {
      return [1, "(本周不足)" + this.data.constLatestOffDutyTime];
    }
    var startTime = new Date();
    startTime.setHours(parseInt(onDutyTimeHour));
    startTime.setMinutes(parseInt(onDutyTimeMinute));
    startTime.setSeconds(1);
    startTime.setMilliseconds(0);
    var tmp = startTime.getTime();
    console.log("tmp Before:" + tmp);
    tmp = parseInt(tmp) + parseFloat(remainingHours) * 3600 * 1000;
    console.log("tmp After:" + tmp);
    var endTime = new Date(tmp);
    var strEndTime = this.PrefixInteger(parseInt(endTime.getHours()), 2) + ":" + this.PrefixInteger(parseInt(endTime.getMinutes()), 2);
    console.log(strEndTime);
    return [0, strEndTime];
  },

  // num传入的数字，n需要的字符长度
  PrefixInteger: function (num, n) {
    return (Array(n).join(0) + num).slice(-n);
  },

  //重填按钮触发
  resetAll: function () {
    //清空数据缓存
    wx.clearStorage({
      success: (res) => {},
    })
    //界面值清空
    this.setData({
      workDurationArray: new Array,
    })
    this.updateworkDurationArray();
    this.setData({
      remainingWorkingHours: "",
      getOffWorkTime: "",
      goToWorkTime: "08:30"
    })
  }
})
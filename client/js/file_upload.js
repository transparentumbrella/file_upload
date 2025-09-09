/**
 * 文件上传js类，支持整块上传和分块上传
 * 整块上传支持取消，联网重传，网速和进度实时刷新
 * 分块上传支持取消，暂停，断点续传，联网续传，网速和进度实时刷新，上传并发数控制
 * 本js依赖:
 * jquery-3.3.1.min.js
 * spark-md5.min.js
 * 版本 v1 2021-07-14 20:10:13
 * 使用方法：

    var upload_task_list = []//上传任务列表
    var token = '123456'
    $('body').on('change','#file_upload',function(e){
        let id = 'file_tmp_'+upload_task_list.length //自编元素id
        let id_name = obj.attr('id') //元素id名
        obj.parent().find('.file_info').append('<div style="border:2px dashed #23c6c8;padding:5px " ><span >文件名称：'+file.name+'</span><br/><span >文件大小：'+byte2Size(file.size)+'</span><br/><span >文件格式：'+(file.type|| '-')+'</span><br/>' +
        '<div  class="up_progress"  id="'+id+'"  >' +
            '<div style="display: flow-root;">' +
                '<div style="float:left">'+
                    '   速度:<span class="upload_progress_speed">-</span><br/>' +
                    '   进度:<span class="upload_progress_percentage_str">-</span><br/>' +
                    '   状态:<span class="upload_status">-</span><br/>' +
                    '</div>' +
                '<div style="float:right" class="upload_operation_btn" >' +
                '   <span class="btn btn-info upload_start"  for-id="'+id+'"     style="float: right;margin-left: 5px">上传</span>' +
                '   <span class="btn btn-info upload_suspend"  for-id="'+id+'"  style="float: right;margin-left: 5px">暂停</span>' +
                '   <span class="btn btn-info upload_cancel"  for-id="'+id+'"     style="float: right;margin-left: 5px">取消</span>' +
                '</div>' +
            '</div>' +
        '</div></div></div>');
        //初始化上传
        let file_upload_d = new file_upload();
        file_upload_d.id = id
        file_upload_d.file = file
        file_upload_d.operation_url = {
            'upload_info':operation_url.upload_info,
            'upload_file':operation_url.upload_file,
        }
        let Headers = {
            'authorization':'Bearer '+token,
        };
        file_upload_d.headers = Headers
        if(id_name == 'file_chunk'){
            file_upload_d.upload_method = 'chunk'
        }
        //开始上传回调
        file_upload_d.uploading_callback = function(){
            console.log('====开始上传回调==uploading_callback===')
        }
        //进度回调
        file_upload_d.progress_callback = function(){
            console.log('====进度回调==progress_callback===',file_upload_d.progress)
            $('#'+file_upload_d.id).find('.upload_progress_percentage_str').html(file_upload_d.progress.file_upload_percentage + '%   '+ byte2Size(file_upload_d.progress.file_upload_size) + " / " + byte2Size(file_upload_d.progress.file_size))
        }
        //速度回调
        file_upload_d.speed_callback = function(){
            console.log('====速度回调==speed_callback===')
            $('#'+file_upload_d.id).find('.upload_progress_speed').html(byte2Size(file_upload_d.progress.increase_bytes) + '/s' )
            $('#'+file_upload_d.id).find('.upload_progress_percentage_str').html(file_upload_d.progress.file_upload_percentage + '%   '+ byte2Size(file_upload_d.progress.file_upload_size) + " / " + byte2Size(file_upload_d.progress.file_size))
        }
        //切片成功回调
        file_upload_d.chunking_success_callback = ()=>{
            console.log('====切片成功回调==chunking_success_callback===')
        }
        //取消成功回调
        file_upload_d.cancel_callback = ()=>{
            console.log('====取消成功回调==cancel_callback===')
        }
        //暂停成功回调
        file_upload_d.pause_callback = ()=>{
            console.log('====暂停成功回调==pause_callback===')
        }
        //操作失败回调
        file_upload_d.fail_callback = ()=>{
            console.log('====操作失败回调==fail_callback===')
            console.log(file_upload_d.get_results())
        }
        //操作成功回调
        file_upload_d.success_callback = function(e){
            console.log('====操作成功回调==success_callback===')
            console.log(file_upload_d.get_results())
        }
        //状态回调
        file_upload_d.status_callback = function(e){
            console.log('====状态回调==status_callback===')
            let status_str = '等待上传';//上传状态    0 等待上传  1 上传中  2 暂停 3 取消   4 上传成功 5 上传失败 
            switch (file_upload_d.get_status()) {
                case 0:
                    break;
                case 1:
                    status_str = '上传中';
                    break;
                case 2:
                    status_str = '暂停';
                    break;
                case 3:
                    status_str = '取消';
                    break;
                case 4:
                    status_str = '上传成功';
                    break;
                case 5:
                    status_str = '上传失败';
                    break;
                default:
                    break;
            }
            $('#'+file_upload_d.id).find('.upload_status').html(status_str)
        }
        //将对象写入到数组中，方便独立控制上传或多个文件同时上传
        upload_task_list.push(file_upload_d)
    })
    //开始上传按钮事件
    $('body').on('click','.upload_start',function(){
        let id = $(this).attr('for-id');
        $.each(upload_task_list,function(i,v){
            if(id == v.id){
                v.upload_start()
                return false;
            }
        })
    });

    //计算文件大小函数(保留两位小数)，自带单位  size 文件字节大小
    function byte2Size(size) {
        if (!size)
            return "0B";
        var num = 1024.00; //byte
        if (size < num)
            return size + "B";
        if (size < Math.pow(num, 2))
            return (size / num).toFixed(2) + "K"; //kb
        if (size < Math.pow(num, 3))
            return (size / Math.pow(num, 2)).toFixed(2) + "M"; //M
        if (size < Math.pow(num, 4))
            return (size / Math.pow(num, 3)).toFixed(2) + "G"; //G
        return (size / Math.pow(num, 4)).toFixed(2) + "T"; //T
    }



 **/
class file_upload{
    /* 配置群组 */
    id = '';//文件id，供外部关联使用
    file = null;//文件实体
    upload_method = 'whole';//上传方法，可选：whole整块（默认）和chunk分块
    headers = {};//请求时携带的头
    operation_url = {//请求地址
        upload_info:'',//获取文件信息和取消操作使用
        upload_file:'',//上传文件使用
    }
    chunk_size = 2048 //单个分片大小 单位Kb   默认 2048kb 2m
    progress = { //进度
        file_size : 0,//文件总字节
        file_upload_size : 0,//文件已上传字节
        increase_bytes : 0,//文件上传速度，单位字节，由speed_refresh自维护
        file_upload_percentage : 0,//文件上传进度，标识已上传百分比，一个整型数字，如55就是已上传55%
    };
    chunk_concurrency_max = 3 //同时最大并发上传数
    /* 内部配置群组 */
    #chunk_concurrency_now = 0 //当前运行并发上传数
    #xhr_arr = [];//xhr实体，临时保存
    #file_md5 = '' //文件md5
    #file_id = '' //文件id，由get_chunk_info接口返回获得
    #chunk_info = { //分片信息
        chunk_num:0,//分片总个数
        chunk_ok_num:0,//分片已成功上传个数
        /*
            分片本体列表数组，字段：
            'chunk':分片实体
            'chunk_size':分片大小
            'chunk_md5':分片md5
            'chunk_status': 上传状态  1等待上传  2上传中  3上传成功  4上传失败  5缺失
            'chunk_no': 编号
        */
        chunk_arr:[],
        chunk_exists_arr:[], //分片已存在列表，由get_chunk_info接口返回获得
    }
    #status = 0 //上传状态    0 等待上传  1 上传中  2 暂停 3 取消   4上传成功 5 上传失败
    #status_wait = 0 //上传状态_等待上传
    #status_uploading = 1 //上传状态_上传中
    #status_pause = 2 //上传状态_暂停
    #status_cancel = 3 //上传状态_取消
    #status_success = 4 //上传状态_上传成功
    #status_fail = 5 //上传状态_上传失败
    
    #chunk_status = 0 //分块上传状态    0 等待上传  1 上传中  2 暂停 3 取消   4上传成功 5 上传失败
    #chunk_status_wait = 0 //分块上传状态_等待上传
    #chunk_status_uploading = 1 //分块上传状态_上传中
    #chunk_status_pause = 2 //分块上传状态_暂停
    #chunk_status_cancel = 3 //分块上传状态_取消
    #chunk_status_success = 4 //分块上传状态_上传成功
    #chunk_status_fail = 5 //分块上传状态_上传失败

    #increase_bytes_tmp = 0 //增量字节缓存
    #filereader = new FileReader();//FileReader实体
    #results = null //返回值缓存
    constructor() {
        //设置网络状态事件事件，网络重新连接后主动继续上传
        window.addEventListener('online', () => {
            if(this.#status == this.#status_fail){
                    this.upload_continue()
            }
        });
        window.addEventListener('offline', () => {
            if(this.#status == this.#chunk_status_uploading){
                this.#status_refresh(this.#status_fail)
            }
        });
    }
    /* 执行群组 */
    //开始上传
    upload_start(){
        //防双击
        if(this.#status == this.#status_uploading){
            return false;
        }
        //防未设置实体
        if(this.file == null){
            this.#status_refresh(this.#status_fail)
            return;
        }
        //防无效文件实体
        if(typeof this.file.size == "undefined" || this.file.size <= 0){
            this.#status_refresh(this.#status_fail)
            return;
        }
        this.#parameter_init()
        this.#status_refresh(this.#status_uploading)
        switch(this.upload_method){
            case 'whole'://整块上传
                this.#upload_whole_start();
                break;
            case 'chunk'://分块上传
                this.#upload_chunk_start()
                //启动上传
            break;
        }
        return true
    }
    //取消上传
    upload_cancel(){
        if(this.#status == this.#status_cancel){
            return true;
        }
        this.#status_refresh(this.#status_cancel)
        return true
    }
    //继续上传
    upload_continue(){
        this.upload_start()
        return true
    }
    //暂停上传
    upload_suspend(){
        switch(this.upload_method){
            case 'whole'://整块上传，暂停上传不适用整块上传
                return false
                break;
            case 'chunk'://分块上传，暂停上传仅适用分块上传
            break;
        }
        this.#status_refresh(this.#status_pause)
        return true
    }
    //文件上传-整块上传
    async #upload_whole_start(){
        //第1步 获取文件md5
        this.#file_md5 = await this.#get_file_md5(this.file);
        let obj = this;
        //第2步 与现存文件对比，获取已存在文件列表
        let formData = new FormData();
        formData.set('file_md5', obj.#file_md5);
        formData.set('file_size', obj.file_size);
        formData.set('file_chunk_size', 0);
        formData.set('upload_operation', 'upload_info');
        obj.#requestNetwork(obj.operation_url.upload_info,'post', formData,this.headers).then(function (results) {
            obj.#results = results
            if (results.code != 1) { //网络请求异常
                obj.#status_refresh(obj.#status_fail)
                return;
            }
            if (results.data.code != 1) { //逻辑操作异常
                obj.#status_refresh(obj.#status_fail)
                return;
            }
            obj.#file_id = results.data.data.file_id
            //状态分发
            switch (parseInt(results.data.data.status)) {
                    case obj.#status_wait://等待上传
                    case obj.#status_uploading://上传中
                        break;
                    case obj.#status_pause://暂停
                    case obj.#status_cancel://取消
                    case obj.#status_fail://上传失败
                        obj.#status_refresh(obj.#status_fail)
                        return;
                        break;
                    case obj.#status_success://上传成功
                        obj.#status_refresh(obj.#status_success)
                        return;
                        break;
                    default:
                        break;
            }
            //第3步 启动上传
            let formData = new FormData();
            formData.set('file_id', obj.#file_id);
            formData.set('file', obj.file);
            formData.set('upload_operation', 'upload_file');
            let timeout = 0;
            let lockName = '';
            let returnType = 'json';
            //进度变动回调
            let progress_callback_d = function(total,loaded,upload_percentage,xhr){
                //修正进度误差，由于loaded返回的是整体数据包的大小，里面包含字段名等信息的大小，而不是指定文件的大小，故修正为文件大小
                if(loaded > obj.progress.file_size){
                    loaded = obj.progress.file_size
                }
                obj.progress.file_upload_size = loaded
                obj.progress.file_upload_percentage = upload_percentage
                if(obj.#xhr_arr.length == 0){
                    obj.#xhr_arr.push(xhr)
                }
                obj.progress_callback()
            }
            obj.#requestNetwork(obj.operation_url.upload_file, 'post', formData,obj.headers,timeout,lockName,returnType,progress_callback_d).then((results)=>{
                obj.#results = results
                if (results.code != 1) { //网络请求异常
                    obj.#status_refresh(obj.#status_fail)
                    return;
                }
                if (results.data.code != 1) { //逻辑操作异常
                    obj.#status_refresh(obj.#status_fail)
                    return;
                }
                obj.#status_refresh(obj.#status_success)
            }).catch(error=>{ //网络请求失败
                //修正主动暂停和取消导致的网络异常
                if(obj.#status == obj.#status_pause || obj.#status == obj.#status_cancel){
                    return;
                }
                let error_msg = error.msg || error.message;
                obj.#results = {
                    data:{
                        code:0,
                        msg:error_msg,
                        data:{},
                    }
                }
                obj.#status_refresh(obj.#status_fail)
            });
        }).catch(error=>{ //网络请求失败
            //修正主动暂停和取消导致的网络异常
            if(obj.#status == obj.#status_pause || obj.#status == obj.#status_cancel){
                return;
            }
            let error_msg = error.msg || error.message;
            obj.#results = {
                data:{
                    code:0,
                    msg:error_msg,
                    data:{},
                }
            }
            obj.#status_refresh(obj.#status_fail)
        });
        
    }
    //文件上传-分块上传
    async #upload_chunk_start(){
        //第1步 获取文件md5
        this.#file_md5 = await this.#get_file_md5(this.file);
        let obj = this;
        //第2步 与现存文件对比，获取已存在文件列表
        let formData = new FormData();
        formData.set('file_md5', obj.#file_md5);
        formData.set('file_size', obj.file.size);
        formData.set('file_chunk_size', obj.chunk_size * 1024);
        formData.set('upload_operation', 'upload_info');
        obj.#requestNetwork(obj.operation_url.upload_info,'post', formData,this.headers).then(function (results) {
            obj.#results = results
            if (results.code != 1) { //网络请求异常
                obj.#status_refresh(obj.#status_fail)
                return;
            }
            if (results.data.code != 1) { //逻辑操作异常
                obj.#status_refresh(obj.#status_fail)
                return;
            }
            obj.#file_id = results.data.data.file_id
            //状态分发
            switch (parseInt(results.data.data.status)) {
                    case obj.#status_wait://等待上传
                    case obj.#status_uploading://上传中
                        break;
                    case obj.#status_pause://暂停
                    case obj.#status_cancel://取消
                    case obj.#status_fail://上传失败
                        obj.#status_refresh(obj.#status_fail)
                        return;
                        break;
                    case obj.#status_success://上传成功
                        obj.#status_refresh(obj.#status_success)
                        return;
                        break;
                    default:
                        break;
            }
            if(results.data.data.chunk_exists_arr.length > 0){
                obj.#chunk_info.chunk_exists_arr = results.data.data.chunk_exists_arr
            }
            //第3步 启动并发上传
            obj.#upload_chunk_concurrency()
        }).catch(error=>{ //网络请求失败
            //修正主动暂停和取消导致的网络异常
            if(obj.#status == obj.#status_pause || obj.#status == obj.#status_cancel){
                return;
            }
            let error_msg = error.msg || error.message;
            obj.#results = {
                data:{
                    code:0,
                    msg:error_msg,
                    data:{},
                }
            }
            obj.#results.data.msg = error_msg
            obj.#status_refresh(obj.#status_fail)
        });
    }
    //启动分块并发上传
    async #upload_chunk_concurrency(){
        let obj =  this;
        //分片
        obj.#chunk_info.chunk_arr = await obj.#file_chunk()
        this.chunking_success_callback() //由于大文件分块比较耗时，触发一次分块成功回调
        obj.#chunk_info.chunk_num = obj.#chunk_info.chunk_arr.length
        //将已存在的分片标记
        if(obj.#chunk_info.chunk_exists_arr.length > 0){
            obj.#chunk_info.chunk_ok_num = obj.#chunk_info.chunk_exists_arr.length
            $.each(obj.#chunk_info.chunk_exists_arr,function (i,v) {
                $.each(obj.#chunk_info.chunk_arr,function (is,vs) {
                    if(v == vs.chunk_no){
                        vs.chunk_status = obj.#chunk_status_success
                        //合并初始流量
                        obj.progress.file_upload_size += vs.chunk_size
                        obj.#increase_bytes_tmp += vs.chunk_size 
                        //合并初始流量后主动刷新一次进度
                        obj.progress.file_upload_percentage = Math.floor((obj.progress.file_upload_size / obj.progress.file_size) * 100);
                    }
                })
            })
        }
        let formData = new FormData();
        formData.set('upload_operation', 'upload_file');
        let timeout = 0;
        let lockName = '';
        let returnType = 'json';
        //启动并发上传
        let od_t = setInterval(function () {
            if(obj.#chunk_concurrency_now >= obj.chunk_concurrency_max){
                return true;
            }
            if (obj.#status != 1) {
                clearInterval(od_t);
            }
            $.each(obj.#chunk_info.chunk_arr,function (chunk_arr_i, chunk_arr_v) {
                //响应自身暂停和取消
                switch (obj.#status) {
                    case obj.#status_wait://等待上传
                    case obj.#status_uploading://上传中
                        break;
                    case obj.#status_pause://暂停
                        return true;
                        break;
                    case obj.#status_cancel://取消
                    case obj.#status_success://上传成功
                    case obj.#status_fail://上传失败
                        return false;
                        break;
                    default:
                        break;
                }
                //响应分块暂停和取消
                switch (chunk_arr_v.chunk_status) {
                    case obj.#chunk_status_wait://等待上传
                        break;
                    case obj.#chunk_status_uploading://上传中
                    case obj.#chunk_status_pause://暂停
                    case obj.#chunk_status_cancel://取消
                    case obj.#chunk_status_success://上传成功
                    case obj.#chunk_status_fail://上传失败
                        return true;
                        break;
                    default:
                        break;
                }
                if(obj.#chunk_concurrency_now >= obj.chunk_concurrency_max){
                    return false;
                }
                obj.#chunk_concurrency_now ++
                chunk_arr_v.chunk_status = obj.#chunk_status_uploading
                formData.set('file_id', obj.#file_id);
                formData.set('file_no', chunk_arr_v.chunk_no);
                formData.set('file_md5', chunk_arr_v.chunk_md5);
                formData.set('file_size', chunk_arr_v.chunk_size);
                formData.set('file', chunk_arr_v.chunk);
                //进度变动回调
                let progress_callback_d = function(total,loaded,upload_percentage,xhr){
                    obj.progress.file_upload_size += loaded
                    //修正进度误差，由于loaded返回的是整体数据包的大小，里面包含字段名等信息的大小，而不是指定文件的大小，故修正为文件大小
                    if(obj.progress.file_upload_size > obj.progress.file_size){
                        obj.progress.file_upload_size = obj.progress.file_size
                    }
                    obj.#xhr_arr[chunk_arr_v.chunk_no] = xhr
                    obj.progress_callback()
                }
                obj.#requestNetwork(obj.operation_url.upload_file, 'post', formData,obj.headers,timeout,lockName,returnType,progress_callback_d).then(function (results) {
                    obj.#chunk_concurrency_now --
                    if (results.code != 1) { //网络请求异常
                        chunk_arr_v.chunk_status = obj.#chunk_status_fail
                        return;
                    }
                    if (results.data.code != 1) { //逻辑操作异常
                        chunk_arr_v.chunk_status = obj.#chunk_status_fail
                        return;
                    }
                    chunk_arr_v.chunk_status = obj.#chunk_status_success
                    obj.#chunk_info.chunk_ok_num ++
                    //分片全部上传成功
                    if(obj.#chunk_info.chunk_ok_num == obj.#chunk_info.chunk_num){
                        obj.#status_refresh(obj.#status_success)
                    }
                }).catch(error=>{ //网络请求失败
                    chunk_arr_v.chunk_status = obj.#chunk_status_fail
                    obj.#chunk_concurrency_now --
                });
            });
        },200);
    }
    /* 回调方法群组 */
    //分块成功回调，仅分块上传适用
    chunking_success_callback = function(){
    }
    //开始上传回调
    uploading_callback = function(){
    }
    //进度回调
    progress_callback = function(){
    }
    //取消成功回调
    cancel_callback = function(){
    }
    //暂停成功回调
    pause_callback = function(){
    }
    //速度回调，启动上传后将每秒回调，用于实时刷新网速，发生失败，成功，暂停，取消等事件后将主动结束回调
    speed_callback = function(){
    }
    //状态回调，当状态发生改变后触发回调
    status_callback = function(){
    }
    //操作成功回调
    success_callback = function(){
    }  
    //操作失败回调
    fail_callback = function(){
    }
    /* 方法群组 */
    //获取文件md5  使用方法： let md5 = await this.#getFileMD5(file);
    #get_file_md5(file) {
        return new Promise((resolve, reject) => {
            this.#filereader.readAsArrayBuffer(file);
            this.#filereader.onload = function(e) {
                let md5 = SparkMD5.ArrayBuffer.hash(e.target.result);
                resolve(md5);
            };
            this.#filereader.onerror = function(e) {
                reject(e);
            };
        });
    }
    /*
        文件分片，内部使用
        file 文件本体
        chunk_size 分片大小   单位 Kb  不填默认2048K，2M
    */
    async #file_chunk() {
        let bytes_perpiece = 1024 * this.chunk_size; // 每个文件切片大小 单位 字节
        let start = 0;
        let chunk_no = 1;
        let end = 0;
        let chunk = [];
        let chunk_tmp = null;
        let chunk_md5 = '';
        let file_size = this.file.size;
        while(start < file_size) {
            end = start + bytes_perpiece;
            if(end > file_size) {
                end = file_size;
            }
            chunk_tmp = this.file.slice(start,end);
            chunk_md5 = await this.#get_file_md5(chunk_tmp);
            chunk.push({
                'chunk':chunk_tmp,
                'chunk_size':chunk_tmp.size,
                'chunk_md5':chunk_md5,
                //分片上传状态  0等待上传  1上传中  2 暂停 3 取消  4上传成功  5上传失败
                'chunk_status':this.#chunk_status_wait,
                'chunk_no':chunk_no,
            });
            start = end;
            chunk_no ++;
        }
        return chunk;
    }
    //状态刷新，从内部主动触发 status_command 状态指令
    #status_refresh(status_command){
        if(status_command == this.#status){
            return false
        }
        switch (status_command) {
            case this.#status_wait://等待上传
                break;
            case this.#status_uploading://上传中
                this.#speed_refresh()//启动网速刷新
                this.uploading_callback()
                break;
            case this.#status_pause://暂停
                $.each(this.#xhr_arr,function (i,v) {
                    try {
                        v.abort()
                    } catch (error) {
                    }
                })
                this.#xhr_arr = []
                this.pause_callback()
                break;
            case this.#status_cancel://取消
                if(this.#status == this.#status_wait){
                    this.cancel_callback();
                    return true;
                }
                $.each(this.#xhr_arr,function (i,v) {
                    try {
                        v.abort()
                    } catch (error) {
                    }
                })
                this.#xhr_arr = []
                let formData = new FormData();
                formData.set('upload_operation', 'upload_cancel');
                formData.set('file_id', this.#file_id);
                let obj = this;
                obj.#requestNetwork(this.operation_url.upload_info, 'post', formData,this.headers).then(function (results) {
                    obj.#results = results
                    if (results.code != 1) { //网络请求异常
                        obj.#status_refresh(obj.#status_fail)
                        return;
                    }
                    if (results.data.code != 1) { //逻辑操作异常
                        obj.#status_refresh(obj.#status_fail)
                        return;
                    }
                    obj.cancel_callback();
                }).catch(error=>{ //网络请求失败
                    let error_msg = error.msg || error.message;
                    obj.#results = {
                        data:{
                            code:0,
                            msg:error_msg,
                            data:{},
                        }
                    }
                    obj.#results.data.msg = error_msg
                    obj.#status_refresh(obj.#status_fail)
                });
                break;
            case this.#status_success://上传成功
                this.success_callback()
                break;
            case this.#status_fail://上传失败
                $.each(this.#xhr_arr,function (i,v) {
                    try {
                        v.abort()
                    } catch (error) {
                    }
                })
                this.#xhr_arr = []
                this.fail_callback()
                break;
            default:
                break;
        }
        this.#status = status_command
        this.status_callback()
    }
    //获取当前状态
    get_status(){
        return this.#status;
    }
    //获取返回值
    get_results(){
        return this.#results;
    }
    
    //参数初始化
    #parameter_init(){
        this.progress = { //进度
            file_size : this.file.size,//文件总字节
            file_upload_size : 0,//文件已上传字节
            increase_bytes : 0,//文件上传速度，单位字节，由speed_refresh自维护
            file_upload_percentage : 0,//文件上传进度，标识已上传百分比，一个整型数字，如55就是已上传55%
        };
        this.#increase_bytes_tmp = 0 //增量字节缓存
        this.file_size = this.file.size  //文件大小
        this.#chunk_concurrency_now = 0 //并发数
    }
    /* 自维护群组 */
    //自维护网速刷新，启动后每秒自主刷新，实现网速计算，仅在status为1（等待）时运行
    #speed_refresh(){
        let od_t = setInterval(()=>{
            this.progress.increase_bytes = this.progress.file_upload_size - this.#increase_bytes_tmp
            this.#increase_bytes_tmp = this.progress.file_upload_size
            //主动刷新一次进度
            this.progress.file_upload_percentage = Math.floor((this.progress.file_upload_size / this.progress.file_size)*100);
            //主动触发一次回调
            this.speed_callback();
            switch (this.#status) {
                case this.#status_wait://等待上传
                case this.#status_uploading://上传中
                    break;
                case this.#status_pause://暂停
                case this.#status_cancel://取消
                case this.#status_success://上传成功
                case this.#status_fail://上传失败
                    clearInterval(od_t);
                    break;
                default:
                    break;
            }
        },1000)
    }
    
    /*
        请求网络
        本方法依赖jquery库，使用前请先引入jquery.js文件
        本方法通过包装jquery.ajax参数实现
        版本 v1 2021-07-14 17:40:25
        版本 v2 2022-03-26 17:01:52
        版本 v3 2023-07-12 21:06:20
        版本 v4 2025-09-09 19:23:10
        
        @param {string} url 请求地址
        @param {object} parame 请求参数
                            键值对象
                            let formData = {
                                name:'jack',
                                age:21,
                            }
                            或者FormData对象
                            let formData = new FormData();
                            formData.set('name','jack');
                            formData.set('age',21);
                            formData.set('file1',$('#filed')[0].files[0]);//添加文件
                            formData.set('file2',$('#filed')[0].files[0],'tmp.txt');//添加文件并自定义文件名
        @param {string} method 请求方法 不区分大小写  可选 POST 和 GET
        @param {object} requestHeader 自定义请求头，一个键值对的对象，不填默认空对象。
                                    注意1：键名不能带底杠（_） 符号，且避免区分大小写，服务器端接收时将首字母自动转大写，会造成混乱
                                    注意2：按照W3C组织规定有部分名字不可自定义（无效），原因详询https://www.w3.org/TR/2010/CR-XMLHttpRequest-20100803/#the-setrequestheader-method
        @param {int} timeout 超时时间 单位：秒，默认25  取值范围： 0-360   上传文件时要置为0，表示取消超时时间，否则可能会报499 400 错误
        @param {string} lockName 锁名称 默认空字符（不锁）  设置非空字符时后，方法内部会上锁，上锁期间多次重复执行（例如双击）本函数会返 {code:4,msg:'操作过快，请稍后',httpCode:0}
                                只有上一次请求结束（解锁）后才可开始下一次请求，用于防双击或强一致性请求等场景使用，一般不用设置
        @param {string} returnType 返回值解析方式 默认json 可选 json jsonp text xml html script
        @param {object} uploadCallback  obj  上传回调，一个回调函数，可获取上传进度，参数里有：
                                            total:总共需要上传的字节
                                            loaded:已上传的字节
                                            upload_percentage:上传的进度百分比 取值：0-100
        @return {object} 返回一个Promise对象 成功触发then() 失败触发 catch()
                        不管成功或失败，返回值都有固定结构：{code:0,msg:'',data:{},httpCode:0}，字段解释：
                            code:联网结果  1成功（此处仅代表网络连接成功，并不是业务层面成功，具体得获取到返回值在上层自行判断）  0失败
                            msg: 联网失败时的原因，成功时统一返回【请求成功】，目前有：
                                    请求成功
                                    url参数错误
                                    timeout参数错误
                                    操作过快，请稍后
                                    网络连接超时
                                    网络连接失败（可能为url错误、option请求或跨域请求被拦截、本机网络断开等，详情请检查控制台报错信息）
                                    程序异常
                            data:返回值
                            httpCode:http状态码，如200、302、500，0表示联网失败或发生异常
        使用方法：
                极简get请求
                        requestNetwork('https://qq.com').then(function(response){
                            console.log(response)
                        }).catch(function(error){ //网络请求失败
                            let error_msg = error.msg || error.message;
                            console.log(error_msg)
                        });
                post文本和文件组合请求
                        let formData = new FormData();
                        formData.set('name','zhangsan');
                        formData.set('age',21);
                        formData.set('file1',$('#filed')[0].files[0]);//添加文件
                        formData.set('file2',$('#filed')[0].files[0],'tmp.txt');//添加文件并自定义文件名
                        let requestHeader = {
                            'header1':111,
                            'header2':222,
                        };
                        let timeout = 25;
                        let lockName = 'lock_1';
                        let returnType = 'json';
                        let uploadCallback = function (total,loaded,upload_percentage) {
                            console.log(total,loaded,upload_percentage)
                        };
                        requestNetwork('https://qq.com',formData,'post',requestHeader,timeout,lockName,returnType,uploadCallback).then(function(response){
                            console.log(response)
                        }).catch(function(error){ //网络请求失败
                            let error_msg = error.msg || error.message;
                            console.log(error_msg)
                        });
                请求时上锁
                        let formData = new FormData();
                        formData.set('name','zhangsan');
                        formData.set('age',21);
                        formData.set('filed',$('#filed')[0].files[0]);//添加文件
                        let requestHeader = {
                            'header1':111,
                            'header2':222,
                        };
                        let timeout = 10;
                        let lockName = 'lock_1';//需要上锁
                        requestNetwork('https://qq.com',formData,'post',requestHeader,timeout,lockName).then(function(response){
                            console.log(response)
                        }).catch(function(error){ //网络请求失败
                            let error_msg = error.msg || error.message;
                            console.log(error_msg)
                        });
                自定义请求头
                        let formData = new FormData();
                        formData.set('name','zhangsan');
                        formData.set('age',21);
                        let requestHeader = {
                            // 注意1：键名不能带底杠（_） 符号，且避免区分大小写，服务器端接收时将首字母自动转大写，会造成混乱
                            // 注意2：按照W3C组织规定有部分名字不可自定义（无效），原因详询https://www.w3.org/TR/2010/CR-XMLHttpRequest-20100803/#the-setrequestheader-method
                            'header1':111,//自定义头1
                            'header2':222,//自定义头2
                        };
                        requestNetwork('https://qq.com',formData,'post',requestHeader).then(function(response){
                            console.log(response)
                        }).catch(function(error){ //网络请求失败
                            let error_msg = error.msg || error.message;
                            console.log(error_msg)
                        });
                取消请求
                        let xhr_tmp = null;
                        let formData = new FormData();
                        formData.set('name','zhangsan');
                        formData.set('age',21);
                        formData.set('file1',$('#filed')[0].files[0]);//添加文件
                        formData.set('file2',$('#filed')[0].files[0],'tmp.txt');//添加文件并自定义文件名
                        let requestHeader = {
                            'header1':111,
                            'header2':222,
                        };
                        let timeout = 25;
                        let lockName = 'lock_1';
                        let returnType = 'json';
                        let uploadCallback = function (total,loaded,upload_percentage,xhr) {
                            console.log(total,loaded,upload_percentage)
                            xhr_tmp = xhr
                        };
                        requestNetwork('https://qq.com',formData,'post',requestHeader,timeout,lockName,returnType,uploadCallback).then(function(response){
                            console.log(response)
                        }).catch(function(error){ //网络请求失败
                            let error_msg = error.msg || error.message;
                            console.log(error_msg)
                        });
                        //取消请求
                        xhr_tmp.abort()

    */
    #requestNetwork(url, method = 'GET', parame = {}, requestHeader = {}, timeout = 25, lockName = '', returnType = 'json', uploadCallback = null){
        return new Promise(function(resolve, reject){
            if (!url || url.length < 1){ //请求地址必填
                reject({code:0, msg:'url参数错误', data:{},httpCode:0});
                return;
            }
            if (timeout < 0){ //超时时间不可小于0秒 0 为不限，用于文件上传
                reject({code:0,msg:'timeout参数错误',data:{},httpCode:0});
                return '';
            }
            let isLock = false;
            let xhr = {};//ajax实体
            if (lockName != ''){
                isLock = true;
                if(typeof request_network_lock_a8sk7d0vp0609 == 'undefined'){
                request_network_lock_a8sk7d0vp0609 = {};
                }
                if ((typeof request_network_lock_a8sk7d0vp0609[lockName] == 'boolean') && (request_network_lock_a8sk7d0vp0609[lockName] == true)) { //已存在
                    reject({code:0,msg:'操作过快，请稍后',data:{},httpCode:0});
                    return;
                }
                request_network_lock_a8sk7d0vp0609[lockName] = true;//上锁
            }
            //自适应FormData对象（文件上传场景）
            let processDataD = true;
            let contentTypeD = 'application/x-www-form-urlencoded';
            let requestParameType = Object.getPrototypeOf(parame).toString();
            if (requestParameType == '[object FormDataPrototype]' || requestParameType == '[object FormData]'){
                processDataD = false;
                contentTypeD = false;
            }
            let timeoutD = timeout * 1000;
            let methodType = (method.toUpperCase() == 'GET') ? 'GET' :'POST';
            let upload_percentage = null;//上传文件的进度百分比
            let percentage = 0;//进度
            //上传进度监听方法
            let xhrOnProgress = function(fun) {
                xhrOnProgress.onprogress = fun; //绑定监听
                //使用闭包实现监听绑
                return function() {
                    let xhr = $.ajaxSettings.xhr();//通过$.ajaxSettings.xhr()获得XMLHttpRequest对象
                    if(typeof xhrOnProgress.onprogress !== 'function'){ //判断监听函数是否为函数
                        return xhr;
                    }
                    if(xhrOnProgress.onprogress && xhr.upload) { //如果有监听函数并且xhr对象支持绑定时就把监听函数绑定上去
                        xhr.upload.onprogress = xhrOnProgress.onprogress;
                    }
                    return xhr;
                }
            };
            try {
                xhr = $.ajax({
                    url: url,//请求地址
                    type: methodType,//请求方式
                    timeout: timeoutD,//ajax 联网超时时间 默认10秒  注意，有文件上传时要置为0 否则服务器可能会报499 400 错误
                    data: parame,//请求参数
                    headers: requestHeader,//请求头
                    beforeSend:function(XMLHttpRequest){}, //请求前调用
                    complete:function(XMLHttpRequest, textStatus){},//请求状态改变后调用（如成功、失败、解析错误、上传中时）
                    xhr: xhrOnProgress(function(e) {
                        if(typeof uploadCallback !== 'function'){ //判断监听函数是否为函数
                            return;
                        }
                        percentage = Math.floor((e.loaded / e.total) * 100);
                        if (percentage == upload_percentage){
                            return true;
                        }
                        upload_percentage = percentage;
                        uploadCallback(e.total,e.loaded,upload_percentage,xhr);
                    }),
                    success: function(data,readyState,httpData){ //请求成功后调用
                        isLock && (request_network_lock_a8sk7d0vp0609[lockName] = false);//解锁
                        resolve({code:1,msg:'操作成功',data:data,httpCode:httpData.status});
                    },
                    error:function(e){ //请求错误后调用
                        isLock && (request_network_lock_a8sk7d0vp0609[lockName] = false);//解锁
                        if (e.statusText == 'timeout'){
                            reject({code:0,msg:'网络连接超时',data:{},httpCode:e.readyState});
                            return;
                        }
                        reject({code:0,msg:'网络连接失败',data:{},httpCode:e.readyState});
                    },
                    dataType: returnType,//返回值解析方式 可选 json jsonp text xml html script
                    async:true,//是否异步 默认true 异步 false 同步
                    cache: false,//jQuery 1.2 新功能，设置为 false 将不会从浏览器缓存中加载请求信息。
                    processData: processDataD,//是否将参数转换为对象（从技术角度来讲并非字符串）以配合默认内容类型"application/x-www-form-urlencoded"  默认true
                    contentType: contentTypeD,//(默认: "application/x-www-form-urlencoded") 发送信息至服务器时内容编码类型。默认值适合大多数应用场合
                    global:false,
                    ifModified:false,
                    jsonp:'',
                    username:'',
                    password:'',
                });
            }catch (e) {
                isLock && (request_network_lock_a8sk7d0vp0609[lockName] = false);//解锁
                reject({code:0,msg:e.message,data:{},httpCode:0});
            }
        });
    }
}
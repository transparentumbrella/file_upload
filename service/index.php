<?php
require_once './rb.php';
R::setup('sqlite:./database/database.db' );
//R::debug();//开启RedBeanPHP调试模式，可打印sql语句
$upload_operation = $_POST['upload_operation'];
$user_id = 1;
//上传第一步_获取上传信息
if($upload_operation == 'upload_info'){
    $file_md5 = !isset($_POST['file_md5']) || empty($_POST['file_md5'])  ?  '' : $_POST['file_md5'];
    $file_size = !isset($_POST['file_size']) || empty($_POST['file_size'])  ?  '0' : $_POST['file_size'];
    $file_chunk_size = !isset($_POST['file_chunk_size']) || empty($_POST['file_chunk_size'])  ?  '0' : $_POST['file_chunk_size'];
    $file_chunk_num = 0;
    if($file_chunk_size > 0){
        $file_chunk_num = ceil($file_size/$file_chunk_size);
    }
    $file_id = 0;
    //upload_info status 状态 0 等待上传 1 上传中  4上传成功 5失效 
    $data = R::getAll( 'SELECT * FROM upload_info WHERE modular = "system" and  user_id = :user_id and file_md5 = :file_md5 and expire_time > CURRENT_TIMESTAMP',
        [
            ':user_id' =>$user_id,
            ':file_md5' =>$file_md5,
        ]
    );
    if(empty($data)){//全新上传
        //检查服务器容量是否足够
        if($file_size > 10000000){
            // echo  json_encode([
            //     'code'=>0,
            //     'msg'=>'容量过大，请稍后再试',
            //     'data'=>[],
            // ]);
            // return;
        }
        $id = R::exec( 'INSERT INTO "upload_info"  
        ( "modular", "user_id", "file_md5", "file_size","chunk_size","chunk_num","expire_time", "create_time") VALUES 
        ( "system",  :user_id,  :file_md5,  :file_size, :chunk_size, :chunk_num, :expire_time,  :create_time)',
                [
                    ':user_id' =>$user_id,
                    ':file_md5' =>$file_md5,
                    ':file_size' =>$file_size,
                    ':chunk_size' =>$file_chunk_size,
                    ':chunk_num' =>$file_chunk_num,
                    ':expire_time' =>date('Y-m-d H:i:s',strtotime('+3 day')),
                    ':create_time' =>date('Y-m-d H:i:s'),
                ]
            );
        if($id != 1){
            echo  json_encode([
                'code'=>0,
                'msg'=>'操作失败，请联系网管'.__LINE__,
                'data'=>[],
            ]);
            return;
        }
        $file_id = R::getInsertID();
        echo  json_encode([
            'code'=>1,
            'msg'=>'全新上传',
            'data'=>[
                'file_id'=>$file_id,
                'chunk_exists_arr'=>[],
                'status'=>0,
            ],
        ]);
        return;
    }else{//2次上传
        $data = $data[0];
        $file_id = $data['id'];
        //检查是否已上传成功
        switch ($data['status']) {
            case 0://等待
                echo  json_encode([
                    'code'=>1,
                    'msg'=>'全新上传',
                    'data'=>[
                        'file_id'=>$file_id,
                        'chunk_exists_arr'=>[],
                        'status'=>$data['status'],
                    ],
                ]);
                return;
                break;
            case 1://上传中
                $chunk_exists_arr = R::getAll( 'SELECT id,file_no FROM upload_tmp WHERE file_id = :file_id and status = 0',
                    [
                        ':file_id' =>$file_id,
                    ]
                );
                echo  json_encode([
                    'code'=>1,
                    'msg'=>'整增补上传',
                    'data'=>[
                        'file_id'=>$file_id,
                        'chunk_exists_arr'=>array_column($chunk_exists_arr,'file_no'),
                        'status'=>$data['status'],
                    ],
                ]);
                return;
                break;
            case 4://成功
                echo  json_encode([
                    'code'=>1,
                    'msg'=>'上传成功',
                    'data'=>[
                        'file_id'=>$file_id,
                        'chunk_exists_arr'=>[],
                        'status'=>$data['status'],
                    ],
                ]);
                return;
                break;
            case 5://失效
                $id = R::exec( 'INSERT INTO "upload_info"  
                    ( "modular", "user_id", "file_md5", "file_size","chunk_size","chunk_num","expire_time", "create_time") VALUES 
                    ( "system",  :user_id,  :file_md5,  :file_size, :chunk_size, :chunk_num, :expire_time,  :create_time)',
                            [
                                ':user_id' =>$user_id,
                                ':file_md5' =>$file_md5,
                                ':file_size' =>$file_size,
                                ':chunk_size' =>$file_chunk_size,
                                ':chunk_num' =>$file_chunk_num,
                                ':expire_time' =>date('Y-m-d H:i:s',strtotime('+3 day')),
                                ':create_time' =>date('Y-m-d H:i:s'),
                            ]
                    );
                if($id != 1){
                    echo  json_encode([
                        'code'=>0,
                        'msg'=>'操作失败，请联系网管'.__LINE__,
                        'data'=>[],
                    ]);
                    return;
                }
                $file_id = R::getInsertID();
                echo  json_encode([
                    'code'=>1,
                    'msg'=>'全新上传',
                    'data'=>[
                        'file_id'=>$file_id,
                        'chunk_exists_arr'=>[],
                        'status'=>0,
                    ],
                ]);
                return;
                break;
            default:
                break;
        }
    }
}
//上传第二步_上传分片   
if($upload_operation == 'upload_file'){
    $file_md5 = !isset($_POST['file_md5']) || empty($_POST['file_md5'])  ?  '' : $_POST['file_md5'];
    $file_size = !isset($_POST['file_size']) || empty($_POST['file_size'])  ?  '0' : $_POST['file_size'];
    $file_no = !isset($_POST['file_no']) || empty($_POST['file_no'])  ?  '0' : $_POST['file_no'];
    $file_id = !isset($_POST['file_id']) || empty($_POST['file_id'])  ?  '0' : $_POST['file_id'];
    //upload_info status 状态 0 等待上传 1 上传中  4上传成功 5失效 
    //upload_tmp status 状态 0 等待上传 1 上传中  4上传成功 5失效 
    $data = R::getAll( 'SELECT * FROM upload_info WHERE modular = "system" and user_id = :user_id and  id = :file_id',
        [
            ':user_id' =>$user_id,
            ':file_id' =>$file_id,
        ]
    );
    //拦截非法上传
    if(empty($data)){
        echo  json_encode([
            'code'=>0,
            'msg'=>'非法上传'.__LINE__,
            'data'=>[],
        ]);
        return;
    }
    $data = $data[0];
    //拦截非法分块
    if($file_size > $data['chunk_size']){
        echo  json_encode([
            'code'=>0,
            'msg'=>'非法分块'.__LINE__,
            'data'=>[],
        ]);
        return;
    }
    if($data['status'] == 4){
        echo  json_encode([
            'code'=>1,
            'msg'=>'已成功',
            'data'=>[],
        ]);
        return;
    }
    if($data['status'] == 5){
        echo  json_encode([
            'code'=>0,
            'msg'=>'已失效',
            'data'=>[],
        ]);
        return;
    }
    //改状态为失效
    if(strtotime($data['expire_time']) < time()){
        $id = R::exec('UPDATE upload_info  set status = 5 ,update_time = :update_time  where id = :id',
            [
                ':id' =>$file_id,
                ':update_time' =>date('Y-m-d H:i:s'),
            ]
        );
        echo  json_encode([
            'code'=>0,
            'msg'=>'已过期',
            'data'=>[],
        ]);
        return;
    }
    //分流整块上传
    if($data['chunk_size'] == 0){
        if($_FILES['file']['error'] == 0){
            //拦截非法分块
            if($_FILES['file']['size'] != $data['file_size']){
                echo  json_encode([
                    'code'=>0,
                    'msg'=>'非法分块'.__LINE__,
                    'data'=>[],
                ]);
                return;
            }
            $order_no = date('Ymd').substr(time(), -5) . substr(microtime(), 2, 5) . sprintf('%02d', rand(1000, 9999));
            $file_new =  '/file/file_'. $order_no .'.tmp';
            $file_new_tmp = __DIR__ . $file_new;
            if(move_uploaded_file($_FILES['file']['tmp_name'], $file_new_tmp) == false){
                echo  json_encode([
                    'code'=>0,
                    'msg'=>'操作失败，请联系网管'.__LINE__,
                    'data'=>[],
                ]);
                return;
            }
            $id = R::exec('UPDATE upload_info  set status = 4,file_path = :file_path,update_time = :update_time  where id = :id',
            [
                ':id' =>$file_id,
                ':file_path' =>$file_new,
                ':update_time' =>date('Y-m-d H:i:s'),
            ]
            );
            echo  json_encode([
                'code'=>1,
                'msg'=>'成功',
                'data'=>[],
            ]);
            return;
        }
        echo  json_encode([
            'code'=>0,
            'msg'=>'操作失败，请联系网管'.__LINE__,
            'data'=>[],
        ]);
        return;
    }

    //改状态为上传中
    if($data['status'] != 1){
        $id = R::exec('UPDATE upload_info  set status = 1 ,update_time = :update_time  where id = :id',
            [
                ':id' =>$file_id,
                ':update_time' =>date('Y-m-d H:i:s'),
            ]
        );
    }
    //拦截重复上传
    $upload_tmp_data = R::getAll( 'SELECT * FROM upload_tmp WHERE file_id = :file_id and file_no = :file_no and status = 0',
        [
            ':file_id' =>$file_id,
            ':file_no' =>$file_no,
        ]
    );
    if(!empty($upload_tmp_data)){
        echo  json_encode([
            'code'=>1,
            'msg'=>'已存在',
            'data'=>[],
        ]);
        return;
    }
    if($_FILES['file']['error'] != 0){
        echo  json_encode([
            'code'=>0,
            'msg'=>$_FILES['file']['error'],
            'data'=>[],
        ]);
        return;
    }
    $order_no = date('Ymd').substr(time(), -5) . substr(microtime(), 2, 5) . sprintf('%02d', rand(1000, 9999));
    if(move_uploaded_file($_FILES['file']['tmp_name'], __DIR__ . '/file_tmp/file_'. $order_no.'.tmp') === false){
        echo  json_encode([
            'code'=>0,
            'msg'=>'操作失败',
            'data'=>[],
        ]);
        return;
    }
    $id = R::exec( 'INSERT INTO "upload_tmp"  
    ("file_id", "file_no", "file_md5","file_path", "create_time") VALUES 
    (:file_id,  :file_no,  :file_md5, :file_path,  :create_time)',
        [
            ':file_id' =>$file_id,
            ':file_no' =>$file_no,
            ':file_md5' =>$file_md5,
            ':file_path' =>'/file_tmp/file_'. $order_no.'.tmp',
            ':create_time' =>date('Y-m-d H:i:s'),
        ]
    );
    if($id != 1){
        echo  json_encode([
            'code'=>0,
            'msg'=>'操作失败，请联系网管'.__LINE__,
            'data'=>[],
        ]);
        return;
    }
    //文件合并
    $data_d = R::getAll( 'SELECT count(id) as num FROM upload_tmp WHERE file_id = :file_id  and status = 0',
            [
                ':file_id' =>$file_id,
            ]
        );
    //启动合并
    if(!empty($data_d) &&  $data_d[0]['num']  == $data['chunk_num']){
            $upload_tmp_all = R::getAll( 'SELECT id,file_no,file_path FROM upload_tmp WHERE file_id = :file_id  and status = 0 order by file_no asc',
                [
                    ':file_id' =>$file_id,
                ]
            );
            // var_dump($upload_tmp_all);
            $order_no = date('Ymd').substr(time(), -5) . substr(microtime(), 2, 5) . sprintf('%02d', rand(1000, 9999));
            $file_new =  '/file/file_'. $order_no .'.tmp';
            $file_new_tmp = __DIR__ . $file_new;
            foreach ($upload_tmp_all as $key => $value) {
                file_put_contents($file_new_tmp,file_get_contents(__DIR__ . $value['file_path']),FILE_APPEND);
            }
            $id = R::exec('UPDATE upload_info  set file_path = :file_path ,status = 4 ,update_time = :update_time  where id = :id',
                [
                    ':id' =>$file_id,
                    ':file_path' => $file_new,
                    ':update_time' =>date('Y-m-d H:i:s'),
                ]
            );
            if($id != 1){
                echo  json_encode([
                    'code'=>1,
                    'msg'=>'操作失败，请联系网管'.__LINE__,
                    'data'=>[],
                ]);
                return;
            }
            //清除文件和数据
            foreach ($upload_tmp_all as $key => $value) {
                unlink(__DIR__ . $value['file_path']);
            }
            R::exec('UPDATE upload_tmp set status = 5 where file_id = :file_id',
                [
                    ':file_id' =>$file_id,
                ]
            );
            echo  json_encode([
                'code'=>1,
                'msg'=>'',
                'data'=>[],
            ]);
            return;
    }
    echo  json_encode([
        'code'=>1,
        'msg'=>'',
        'data'=>[],
    ]);
    return;
}

//取消上传
if($upload_operation == 'upload_cancel'){
    $file_id = !isset($_POST['file_id']) || empty($_POST['file_id'])  ?  '' : $_POST['file_id'];
    $data = R::getAll( 'SELECT * FROM upload_info WHERE modular = "system" and user_id = :user_id and  id = :file_id',
        [
            ':user_id' =>$user_id,
            ':file_id' =>$file_id,
        ]
    );
    if(!empty($data)){//数据存在
        unlink(__DIR__ . $data[0]['file_path']);
    }
    R::exec('UPDATE upload_info set status = 5,update_time = :update_time  where id = :file_id',
        [
            ':file_id' =>$file_id,
            ':update_time' =>date('Y-m-d H:i:s'),
        ]
    );
    
    //清除文件和数据
    $upload_tmp_all = R::getAll( 'SELECT id,file_id,file_no,file_path FROM upload_tmp WHERE file_id = :file_id order by file_no asc',
        [
            ':file_id' =>$file_id,
        ]
    );
    foreach ($upload_tmp_all as $key => $value) {
        unlink(__DIR__ . $value['file_path']);
    }
    R::exec('UPDATE upload_tmp set status = 5 where file_id = :file_id',
        [
            ':file_id' =>$file_id,
        ]
    );
    echo  json_encode([
        'code'=>1,
        'msg'=>'',
        'data'=>[],
    ]);
    return;
}

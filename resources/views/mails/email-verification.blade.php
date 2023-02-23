<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">

<head>
    <meta charset="UTF-8">
    <title>Email 地址验证</title>
    <style type="text/css">
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            background-color: #ECECEC;
        }

        .container {
            width: 800px;
            margin: 50px auto;
        }

        .header {
            height: 80px;
            background-color: #49bcff;
            border-top-left-radius: 5px;
            border-top-right-radius: 5px;
            padding-left: 30px;
        }

        .header h2 {
            padding-top: 25px;
            color: white;
        }

        .content {
            background-color: #fff;
            padding-left: 30px;
            padding-bottom: 30px;
            border-bottom: 1px solid #ccc;
        }

        .content h2 {
            padding-top: 20px;
            padding-bottom: 20px;
        }

        .content p {
            padding-top: 10px;
        }

        .footer {
            background-color: #fff;
            border-bottom-left-radius: 5px;
            border-bottom-right-radius: 5px;
            padding: 35px;
        }

        .footer p {
            color: #747474;
            padding-top: 10px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>欢迎加入 {!! option_localized('site_name') !!} 皮肤站!</h2>
        </div>
        <div class="content">
            <h2>亲爱的用户您好</h2>
            <p>{!! trans('user.verification.mail.message', ['sitename' => option_localized('site_name')]) !!}</p>
            <p>{!! trans('user.verification.mail.ignore') !!}</p>
            <p>{!! trans('user.verification.mail.reset', ['url' => $url]) !!}</p>
            <p>(如果上面不是链接形式，请将该地址手工粘贴到浏览器地址栏再访问)</p>
        </div>
        <div class="footer">
            <p>感谢您的访问，祝您使用愉快！</p>
            <p>此为系统邮件，请勿回复</p>
            <p>请保管好您的信息，避免被他人盗用</p>
        </div>
    </div>
</body>

</html>
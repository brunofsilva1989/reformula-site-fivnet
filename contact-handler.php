<?php
header('Content-Type: application/json; charset=utf-8');

function respond($success, $message, $statusCode = 200) {
	http_response_code($statusCode);
	echo json_encode([
		'success' => $success,
		'message' => $message
	], JSON_UNESCAPED_UNICODE);
	exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond(false, 'Metodo nao permitido.', 405);
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $phone === '' || $subject === '' || $message === '') {
	respond(false, 'Preencha todos os campos obrigatorios.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
	respond(false, 'Informe um e-mail valido.', 422);
}

$to = 'comercial@fivnet.com.br';
$mailSubject = 'Contato via site Fivnet: ' . $subject;
$body = "Nome: {$name}\n";
$body .= "E-mail: {$email}\n";
$body .= "Telefone: {$phone}\n";
$body .= "Assunto: {$subject}\n\n";
$body .= "Mensagem:\n{$message}\n";

$headers = [
	'From: noreply@fivnet.com.br',
	'Reply-To: ' . $email,
	'Content-Type: text/plain; charset=UTF-8'
];

$sent = @mail($to, $mailSubject, $body, implode("\r\n", $headers));

if (!$sent) {
	respond(false, 'Nao foi possivel enviar a mensagem no momento. Verifique a configuracao de e-mail do servidor.', 500);
}

respond(true, 'Mensagem enviada com sucesso. Nossa equipe retornara em breve.');

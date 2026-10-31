#!/usr/bin/perl
use strict;
use warnings;
use IO::Socket::INET;
use File::Basename;

my $port = $ARGV[0] || 8080;
my $server = IO::Socket::INET->new(
    LocalAddr => '0.0.0.0',
    LocalPort => $port,
    Proto     => 'tcp',
    Listen    => 10,
    Reuse     => 1
) or die "Impossibile avviare il server sulla porta $port: $!\n";

my $local_ip = `ipconfig getifaddr en0 2>/dev/null` || `ipconfig getifaddr en1 2>/dev/null` || '127.0.0.1';
chomp($local_ip);

print "========================================================\n";
print "  TrackMaster - Server Web Locale per iPhone & iPad     \n";
print "========================================================\n";
print "  Mac / Locale:      http://localhost:$port\n";
print "  iPhone & iPad:     http://$local_ip:$port\n";
print "========================================================\n";
print "In ascolto... Premi Ctrl+C per fermare.\n\n";

my %mime_types = (
    'html' => 'text/html; charset=utf-8',
    'css'  => 'text/css; charset=utf-8',
    'js'   => 'application/javascript; charset=utf-8',
    'json' => 'application/json; charset=utf-8',
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'ico'  => 'image/x-icon',
    'webmanifest' => 'application/manifest+json'
);

while (my $client = $server->accept()) {
    my $request = <$client>;
    next unless $request;

    my ($method, $path) = split(/\s+/, $request);
    $path =~ s/\?.*$//; # Rimuovi query string
    $path = '/index.html' if $path eq '/' or $path eq '';
    $path =~ s/^\/+//;  # Rimuovi slash iniziale

    # Protezione path traversal
    if ($path =~ /\.\./) {
        print $client "HTTP/1.1 403 Forbidden\r\n\r\nAccesso negato";
        close($client);
        next;
    }

    if (-f $path) {
        my ($ext) = $path =~ /\.([^.]+)$/;
        $ext = lc($ext || '');
        my $content_type = $mime_types{$ext} || 'application/octet-stream';

        open(my $fh, '<:raw', $path) or do {
            print $client "HTTP/1.1 500 Internal Error\r\n\r\n";
            close($client);
            next;
        };
        my $content = do { local $/; <$fh> };
        close($fh);

        my $length = length($content);
        print $client "HTTP/1.1 200 OK\r\n";
        print $client "Content-Type: $content_type\r\n";
        print $client "Content-Length: $length\r\n";
        print $client "Cache-Control: no-cache\r\n";
        print $client "Access-Control-Allow-Origin: *\r\n";
        print $client "Connection: close\r\n\r\n";
        print $client $content;
    } else {
        print $client "HTTP/1.1 404 Not Found\r\n\r\nFile non trovato: $path";
    }

    close($client);
}

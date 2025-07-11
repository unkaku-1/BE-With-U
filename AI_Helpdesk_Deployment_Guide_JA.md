# AIヘルプデスクシステム導入ガイド (日本語版)

## 1. はじめに

この導入ガイドは、Windows 11サーバー上にAIヘルプデスクシステムを導入するための詳細な手順とガイダンスを提供することを目的としています。このシステムは、オープンソースコンポーネントを統合することで、インテリジェントなITサポートを提供し、ITサポートプロセスを最適化するように設計されています。本ガイドでは、環境準備からシステム設定まで、導入プロセスがスムーズに進むようにあらゆる側面を網羅します。

## 2. 環境準備

導入を開始する前に、Windows 11サーバーが以下の前提条件を満たしていることを確認してください。

### 2.1 ハードウェア要件

要件定義書には明確なハードウェア仕様が記載されていませんが、AIヘルプデスクシステムには、対話型AIエンジン（Rasa）、ナレッジベース管理システム（BookStack）、チケット管理システム（osTicket）、およびPostgreSQLデータベースなどのコンポーネントが含まれているため、これらのコンポーネントはCPU、メモリ、ストレージに一定の要件があります。システムが安定して効率的に動作し、最大100人の同時ユーザーをサポートできるように、サーバーは以下の最小ハードウェア構成を備えていることを推奨します。

*   **プロセッサ (CPU)**：最低4コア、推奨8コア以上、2.5 GHz以上のクロック速度。
*   **メモリ (RAM)**：最低16 GB、推奨32 GB以上。RasaモデルのロードとPostgreSQLデータベースのメモリ要件に対応するため。
*   **ストレージ (SSD)**：最低250 GBのソリッドステートドライブ（SSD）、推奨500 GB以上。データベースとAIモデルのパフォーマンスにとって非常に重要な高速な読み書き速度を提供するため。また、ログ、対話履歴、ナレッジベースコンテンツを保存するのに十分なスペースがあることを確認してください。
*   **ネットワーク**：安定したギガビットイーサネット接続。システムが依存関係や更新をダウンロードするためにインターネットにスムーズにアクセスでき、ユーザーに迅速な応答を提供できるようにするため。

### 2.2 オペレーティングシステムの設定

このガイドは、Windows 11オペレーティングシステムがインストールされたサーバーを所有していることを前提としています。最新のセキュリティパッチと機能強化を取得するために、Windows 11システムが最新バージョンに更新されていることを確認してください。「設定」->「Windows Update」から更新を確認し、インストールできます。

### 2.3 ソフトウェアのインストール

AIヘルプデスクシステムは主にDockerを介して導入されるため、環境設定の複雑さが大幅に軽減されます。Dockerはオープンソースのアプリケーションコンテナエンジンであり、開発者がアプリケーションとその依存関係を軽量でポータブルなコンテナにパッケージ化し、任意の一般的なLinuxマシンまたはWindowsマシンに公開することを可能にします。また、仮想化も実現できます。Dockerに慣れていないユーザーにとっては、軽量な仮想マシンと理解できますが、ホストOSのカーネルを共有するため、従来の仮想マシンよりも効率的です。

#### 2.3.1 WSL 2とUbuntuのインストール

Windows上でDocker Desktopを実行するにはWSL 2（Windows Subsystem for Linux 2）のサポートが必要なため、まずWSL 2とUbuntuをインストールする必要があります。WSL 2を使用すると、Windows上で完全なLinuxカーネルを実行でき、Dockerのパフォーマンスと互換性が向上します。

1.  **WSLと仮想マシンプラットフォーム機能の有効化**：
    PowerShell（管理者として実行）を開き、以下のコマンドを実行します。
    ```powershell
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    ```
    実行後、コンピューターを再起動します。

2.  **WSL 2 Linuxカーネル更新パッケージのダウンロードとインストール**：
    Microsoft公式ドキュメント [https://docs.microsoft.com/ja-jp/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package](https://docs.microsoft.com/ja-jp/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package) にアクセスし、x64マシン用の最新のWSL2 Linuxカーネル更新パッケージをダウンロードしてインストールします。

3.  **WSL 2をデフォルトバージョンに設定**：
    PowerShellを開き、以下のコマンドを実行します。
    ```powershell
    wsl --set-default-version 2
    ```

4.  **Ubuntuのインストール**：
    Microsoft Storeを開き、「Ubuntu」を検索し、最新バージョン（例：「Ubuntu 22.04 LTS」）を選択してインストールします。インストール後、初めてUbuntuを起動すると、ユーザー名とパスワードの作成を求められますので、大切に保管してください。

#### 2.3.2 Docker Desktopのインストール

Docker DesktopはWindowsおよびmacOS用のDockerバージョンであり、Docker Engine、Docker CLI、Docker Compose、Kubernetes、Credential Helperなどのツールが含まれており、完全なDocker開発環境を提供します。Linuxコマンドラインに慣れていないユーザーのために、Docker DesktopはDockerコンテナを管理するための直感的なグラフィカルユーザーインターフェース（GUI）を提供します。

1.  **Docker Desktopのダウンロード**：
    Docker公式ウェブサイト [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/) にアクセスし、Windows用のDocker Desktopインストーラーをダウンロードします。

2.  **Docker Desktopのインストール**：
    ダウンロードしたインストーラーを実行し、指示に従ってインストールします。インストール中に、「Enable WSL 2 Features」オプションを必ずチェックしてください。インストールが完了すると、Docker Desktopは自動的に起動します。

3.  **Docker Desktopの設定**：
    Docker Desktopを初めて起動するときは、初期化に時間がかかる場合があります。Docker Desktopが正常に起動し、タスクバーのDockerアイコンが緑色（実行中を示す）になっていることを確認してください。
    *   **WSL 2統合の確認**：Docker Desktopの設定（通常はタスクバーのDockerアイコンを右クリックし、「Settings」を選択）で、「Resources」->「WSL Integration」に移動し、インストールしたUbuntuディストリビューションが有効になっていることを確認します。これにより、DockerはWSL 2環境でLinuxコンテナを実行できるようになります。
    *   **リソース割り当ての調整**：「Resources」->「Advanced」で、サーバーのハードウェア構成に基づいて、Dockerが使用できるCPU、メモリ、ディスクスペースを調整できます。Dockerコンテナが十分なリソースで実行できるように、メモリをサーバーの総メモリの半分以上に設定することをお勧めします。

#### 2.3.3 Gitのインストール

Gitは分散型バージョン管理システムであり、ファイルの変更を追跡し、複数の開発者間の協調を可能にします。要件定義書では、システムがGitHubまたはDocker上のオープンソースプロジェクトに基づいて構築されると述べられていますが、GitHubからプロジェクトコードをクローンするためにGitのインストールは不可欠です。Gitに慣れていないユーザーにとっては、コード管理ツールと理解できます。これはプロジェクトコードの取得と更新に役立ちます。

1.  **Gitのダウンロード**：
    Git公式ウェブサイト [https://git-scm.com/download/win](https://git-scm.com/download/win) にアクセスし、Windows用のGitインストーラーをダウンロードします。

2.  **Gitのインストール**：
    ダウンロードしたインストーラーを実行し、デフォルトオプションでインストールします。インストール中に、Git Bashをコマンドラインツールとして使用することを選択できます。これはLinuxのようなコマンドライン環境を提供し、Gitコマンドの実行に便利です。

### 2.4 ポートの開放

AIヘルプデスクシステムはWebインターフェースを介してサービスを提供するため、サーバーのファイアウォールが関連するポートへの外部アクセスを許可していることを確認する必要があります。要件定義書にはすべてのコンポーネントのデフォルトポートが明示されていませんが、通常、Webサービスは80（HTTP）および443（HTTPS）ポートを使用し、Rasa Webchatなどは他のポートを使用する場合があります。セキュリティ上の理由から、必要なポートのみを開放することをお勧めします。

1.  **Windows Defender ファイアウォールを開く**：
    Windowsの検索バーに「Windows Defender ファイアウォール」と入力し、「詳細設定」を選択します。

2.  **受信の規則を追加**：
    左側のナビゲーションバーで「受信の規則」を選択し、右側の「新しい規則...」をクリックします。

3.  **規則の設定**：
    *   **規則の種類**：「ポート」を選択し、「次へ」をクリックします。
    *   **プロトコルとポート**：「TCP」を選択し、「特定のローカルポート」を選択して、開放する必要があるポート番号（例：`80, 443, 5005, 5002`）を入力します。「次へ」をクリックします。
        *   `80`：HTTPサービス（使用する場合）
        *   `443`：HTTPSサービス
        *   `5005`：Rasa Action Serverのデフォルトポート
        *   `5002`：Rasa Coreのデフォルトポート
    *   **操作**：「接続を許可する」を選択し、「次へ」をクリックします。
    *   **プロファイル**：「ドメイン」、「プライベート」、「パブリック」をチェックし、「次へ」をクリックします。
    *   **名前**：規則に名前を付け（例：「AI Helpdesk Ports」）、「完了」をクリックします。

実際の導入コンポーネントとその使用ポートに合わせて調整してください。本番環境では、セキュリティを強化するために、443ポートのみを開放し、リバースプロキシ（NginxやApacheなど）を介して外部リクエストを内部サービスの対応するポートに転送することを強くお勧めします。

## 3. コンポーネントの導入

AIヘルプデスクシステムは複数のオープンソースコンポーネントで構成されており、このセクションではDocker Composeを使用してこれらのコンポーネントを導入する方法を詳しく説明します。Docker Composeは、複数のコンテナで構成されるDockerアプリケーションを定義および実行するためのツールです。YAMLファイルを使用してアプリケーションのサービスを設定し、1つのコマンドで設定からすべてのサービスを作成および起動できます。これは、相互に依存する複数のコンテナを管理するのに非常に便利です。

### 3.1 プロジェクトのクローン

まず、GitHubからAIヘルプデスクプロジェクトのコードをクローンする必要があります。要件定義書には具体的なプロジェクトリポジトリのアドレスが記載されていないため、ここではすべてのコンポーネントのDocker Compose設定を含む`ai-helpdesk`という名前のリポジトリがあると仮定します。

1.  **作業ディレクトリの選択**：
    Windows 11サーバー上で、プロジェクトコードを保存する適切なディレクトリを選択します。例えば、`C:\ai-helpdesk`です。このディレクトリは、ファイルエクスプローラーで作成するか、Git Bashで`mkdir`コマンドを使用して作成できます。

2.  **プロジェクトのクローン**：
    Git Bash（またはPowerShell/CMD）を開き、選択した作業ディレクトリに移動して、以下のコマンドを実行してプロジェクトをクローンします。
    ```bash
    cd C:\ai-helpdesk
    git clone <AI_Helpdesk_GitHub_Repository_URL> .
    ```
    `<AI_Helpdesk_GitHub_Repository_URL>`を実際のGitHubリポジトリのアドレスに置き換えてください。例えば、プロジェクトが`https://github.com/your-org/ai-helpdesk.git`にある場合、コマンドは次のようになります。
    ```bash
    git clone https://github.com/your-org/ai-helpdesk.git .
    ```
    `.`は、リポジトリの内容を現在のディレクトリにクローンすることを意味し、現在のディレクトリ内に同じ名前のサブディレクトリをさらに作成するわけではありません。

### 3.2 Docker Composeの設定

クローンしたプロジェクトには、Rasa、BookStack、osTicket、PostgreSQLなど、すべてのサービスの設定を定義する`docker-compose.yml`ファイルが含まれているはずです。特定の要件や環境に合わせて、このファイルを調整する必要がある場合があります。

以下は、仮定の`docker-compose.yml`ファイルの例です。実際のプロジェクトファイルに基づいて変更し、理解する必要があります。

```yaml
version: '3.8'

services:
  postgresql:
    image: postgres:13
    container_name: ai_helpdesk_postgresql
    environment:
      POSTGRES_DB: ai_helpdesk_db
      POSTGRES_USER: ai_helpdesk_user
      POSTGRES_PASSWORD: your_strong_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  bookstack:
    image: lscr.io/linuxserver/bookstack:latest
    container_name: ai_helpdesk_bookstack
    environment:
      PUID: 1000
      PGID: 1000
      DB_HOST: postgresql
      DB_DATABASE: ai_helpdesk_db
      DB_USERNAME: ai_helpdesk_user
      DB_PASSWORD: your_strong_password
      APP_URL: http://localhost:8080 # Change to your domain in production
    volumes:
      - bookstack_data:/config
    ports:
      - "8080:80"
    depends_on:
      - postgresql
    restart: always

  osticket:
    image: osticket/osticket:latest
    container_name: ai_helpdesk_osticket
    environment:
      DB_HOST: postgresql
      DB_NAME: ai_helpdesk_db
      DB_USER: ai_helpdesk_user
      DB_PASSWORD: your_strong_password
    volumes:
      - osticket_data:/var/www/html/upload
    ports:
      - "8081:80"
    depends_on:
      - postgresql
    restart: always

  rasa_x:
    image: rasa/rasa-x:latest
    container_name: ai_helpdesk_rasa_x
    environment:
      RASA_X_PASSWORD: your_rasa_x_password
      RASA_X_USERNAME: admin
      RASA_X_HOST: 0.0.0.0
      RASA_X_PORT: 5002
      RASA_X_DB_HOST: postgresql
      RASA_X_DB_NAME: ai_helpdesk_db
      RASA_X_DB_USER: ai_helpdesk_user
      RASA_X_DB_PASSWORD: your_strong_password
    ports:
      - "5002:5002"
    depends_on:
      - postgresql
    restart: always

  rasa_action_server:
    image: rasa/rasa-sdk:latest
    container_name: ai_helpdesk_rasa_action_server
    volumes:
      - ./actions:/app/actions
    ports:
      - "5055:5055"
    restart: always

  rasa_webchat:
    image: botfront/rasa-webchat:latest
    container_name: ai_helpdesk_rasa_webchat
    environment:
      RASA_ENDPOINT: http://rasa_x:5002/webhooks/rest/webhook
      TITLE: AI Helpdesk Chatbot
    ports:
      - "8082:80"
    depends_on:
      - rasa_x
    restart: always

volumes:
  postgres_data:
  bookstack_data:
  osticket_data:
```

**重要事項：**

*   `your_strong_password`と`your_rasa_x_password`を複雑で安全なパスワードに置き換えてください。本番環境では、デフォルトまたは脆弱なパスワードを使用しないでください。
*   BookStackサービスの`APP_URL`は、本番環境に導入する場合、実際のドメイン（例：`https://your-bookstack-domain.com`）に変更する必要があります。
*   `rasa_action_server`の`volumes`設定`./actions:/app/actions`は、ホストの現在のディレクトリにある`actions`フォルダをコンテナ内の`/app/actions`にマッピングすることを意味します。これは、Rasaのカスタムアクションコードがプロジェクトのルートディレクトリの`actions`フォルダにあるべきであることを意味します。
*   `rasa_webchat`の`RASA_ENDPOINT`は`rasa_x`サービスを指しています。これはDocker Compose内部ネットワーク内のサービス名です。Rasa XがDocker Composeを介して導入されていない場合、または外部からアクセスする必要がある場合は、Rasa Xの実際のアクセス可能なアドレスに変更する必要があります。

### 3.3 Docker Composeサービスの起動

`docker-compose.yml`ファイルが正しく設定されていることを確認したら、Docker Composeコマンドを使用してすべてのサービスを起動できます。

1.  **Git Bash（またはPowerShell/CMD）を開く**：
    `docker-compose.yml`ファイルを含むプロジェクトのルートディレクトリ（例：`C:\ai-helpdesk`）に移動します。

2.  **サービスのビルドと起動**：
    以下のコマンドを実行します。
    ```bash
    docker compose up -d --build
    ```
    *   `docker compose up`：`docker-compose.yml`ファイルで定義されているすべてのサービスを起動します。
    *   `-d`：「デタッチ」モードでコンテナを実行します。これは、コンテナがバックグラウンドで実行され、コマンドラインを占有しないことを意味します。
    *   `--build`：サービスに`build`命令がある場合（例えば、カスタムのDockerfileがある場合）、このオプションはイメージの再構築を強制します。事前に構築されたイメージを直接使用するサービスの場合、このオプションは影響しません。

    このコマンドを初めて実行すると、Dockerは必要なすべてのイメージ（ローカルに存在しない場合）をダウンロードし、コンテナを作成して起動します。これには、ネットワーク速度に応じて時間がかかる場合があります。

3.  **サービスの状態の確認**：
    以下のコマンドを使用して、すべてのサービスの実行状態を確認できます。
    ```bash
    docker compose ps
    ```
    すべてのサービスが「Up」と表示されていれば、正常に起動しています。

4.  **ログの表示**：
    サービスが起動に失敗した場合、またはその出力を表示したい場合は、以下のコマンドを使用してログを表示できます。
    ```bash
    docker compose logs <service_name>
    ```
    例えば、Rasa Xのログを表示するには：
    ```bash
    docker compose logs rasa_x
    ```

### 3.4 初期設定

すべてのサービスが正常に起動した後、BookStack、osTicket、Rasaに対していくつかの初期設定を行う必要があります。

#### 3.4.1 BookStackの設定

BookStackはシンプルで使いやすいナレッジベース管理システムであり、Webブラウザからアクセスできます。

1.  **BookStackへのアクセス**：
    Webブラウザで`http://localhost:8080`にアクセスします（`docker-compose.yml`でBookStackのポートが8080の場合）。リモートサーバーに導入されている場合は、サーバーのIPアドレスまたはドメインを使用してください。

2.  **初期設定**：
    初めてアクセスすると、BookStackは管理者ユーザーの作成を含む初期設定を案内します。画面の指示に従って操作し、強力なパスワードを設定してください。

3.  **ナレッジベースコンテンツの作成**：
    ログイン後、ITナレッジ記事、よくある質問、トラブルシューティングガイドの作成と整理を開始できます。BookStackは、Markdown構文をサポートする直感的なエディタを提供します。

#### 3.4.2 osTicketの設定

osTicketは、ユーザーが提出したITサポートリクエストを処理するための人気のあるオープンソースチケット管理システムです。

1.  **osTicketへのアクセス**：
    Webブラウザで`http://localhost:8081`にアクセスします（`docker-compose.yml`でosTicketのポートが8081の場合）。

2.  **初期設定**：
    初めてアクセスすると、osTicketはインストールウィザードを案内します。これには、データベース設定（Docker Composeを介してPostgreSQLに接続しているため、ここでは主に接続情報の確認）、システム設定、管理者アカウントの作成が含まれます。正しいデータベース情報（データベースホスト：`postgresql`、データベース名：`ai_helpdesk_db`、ユーザー名：`ai_helpdesk_user`、パスワード：`your_strong_password`）を入力してください。

3.  **メールとチケットキューの設定**：
    インストール後、osTicket管理者パネルにログインし、メール設定（チケット通知の送受信に使用）とチケットキューを設定します。ITサポートチームの構造に基づいて、異なる部門とチケットトピックを作成できます。

#### 3.4.3 Rasaモデルのトレーニングと導入

Rasaは対話型AIエンジンのコアであり、ユーザーの意図を理解し、応答を生成するためにモデルをトレーニングする必要があります。Rasa Xは、Rasaプロジェクトの管理、モデルのトレーニング、対話の表示のためのWebインターフェースを提供します。

1.  **Rasa Xへのアクセス**：
    Webブラウザで`http://localhost:5002`にアクセスします（`docker-compose.yml`でRasa Xのポートが5002の場合）。

2.  **Rasa Xへのログイン**：
    `docker-compose.yml`で設定したRasa Xのユーザー名（デフォルトは`admin`）とパスワード（`your_rasa_x_password`）を使用してログインします。

3.  **Rasaプロジェクトのアップロード**：
    Rasaプロジェクト（`data/nlu.yml`、`data/stories.yml`、`domain.yml`などのファイルを含む）が既にある場合は、Rasa Xインターフェースを介してアップロードできます。通常、クローンされたGitHubリポジトリにはRasaプロジェクトの例が含まれています。

4.  **モデルのトレーニング**：
    Rasa Xインターフェースで、「Models」または「Training」セクションに移動し、「Train」ボタンをクリックしてRasaモデルをトレーニングします。トレーニングプロセスには、データセットのサイズとサーバーのパフォーマンスに応じて時間がかかる場合があります。

5.  **モデルの導入**：
    トレーニングが完了したら、新しいモデルを本番環境に導入します。Rasa Xでは、モデルを選択してアクティブなモデルとして設定できます。導入されると、Rasa Coreサービスはこのモデルをロードし、ユーザーリクエストの処理を開始します。

6.  **Rasa Action Serverの設定**：
    Rasa Action Serverは、ナレッジベースからの情報取得やチケットの作成など、カスタムアクションを実行するために使用されます。カスタムアクションコード（Pythonファイル）がプロジェクトのルートディレクトリの`actions`フォルダにあり、`rasa_action_server`コンテナがこのボリュームを正しくマッピングしていることを確認してください。
    カスタムアクションコードを変更した場合は、変更を有効にするために`rasa_action_server`コンテナを再起動する必要があります。
    ```bash
    docker compose restart rasa_action_server
    ```

#### 3.4.4 Rasa Webchatの統合

Rasa Webchatは、ユーザーがAIヘルプデスクと対話するためのWebインターフェースです。通常、これは独立したHTML/JavaScriptファイルであり、Rasa X/Coreサービスに接続するように設定する必要があります。

1.  **Webchat設定の確認**：
    `docker-compose.yml`で、`rasa_webchat`サービスは`RASA_ENDPOINT`が設定されています。このエンドポイントがRasa X/Coreサービスを指していることを確認してください。

2.  **Webchatへのアクセス**：
    Webブラウザで`http://localhost:8082`にアクセスします（`docker-compose.yml`でRasa Webchatのポートが8082の場合）。チャットインターフェースが表示され、AIヘルプデスクとの対話を開始できるはずです。

## 4. システム統合とテスト

すべてのコンポーネントの導入と初期設定が完了したら、AIヘルプデスクシステムが期待どおりに機能することを確認するために、システム統合と包括的なテストを行うことが不可欠です。

### 4.1 BookStackとosTicketのRasaへの統合

Rasaは、カスタムアクションを介して外部システム（BookStackやosTicketなど）と対話します。これは、RasaプロジェクトでPythonコードを記述する必要があることを意味します。このコードは、BookStackとosTicketのAPIを呼び出して知識を取得したり、チケットを作成したりします。

1.  **BookStack API統合**：
    *   **APIトークンの取得**：BookStackで、Rasa用のAPIトークンを作成する必要があります。BookStack管理者アカウントにログインし、「Settings」->「API Tokens」に移動し、新しいトークンを作成してIDとシークレットを記録します。これらの情報はRasaのカスタムアクションで使用されます。
    *   **Rasaカスタムアクションの記述**：`actions`フォルダに、BookStackのAPIを呼び出すPythonコードを記述します。例えば、ユーザーがITの問題を尋ねたときに、Rasaはアクションをトリガーして、BookStack APIを介して関連するナレッジ記事を検索し、ユーザーに返します。HTTPリクエストを送信するために`requests`ライブラリを使用できます。
    ```python
    # actions/actions.py 例の抜粋
    import requests
    from rasa_sdk import Action, Tracker
    from rasa_sdk.executor import CollectingDispatcher
    from typing import Any, Text, Dict, List

    class ActionSearchKnowledgeBase(Action):
        def name(self) -> Text:
            return "action_search_knowledge_base"

        def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
            query = tracker.latest_message['text'] # ユーザーのクエリを取得
            bookstack_api_url = "http://bookstack:80/api/pages" # Docker Compose内部サービス名
            headers = {
                "Authorization": "Token <your_bookstack_api_token_id>:<your_bookstack_api_token_secret>",
                "Content-Type": "application/json"
            }
            params = {"search": query}

            try:
                response = requests.get(bookstack_api_url, headers=headers, params=params)
                response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
                data = response.json()
                # BookStackから返されたデータを処理し、関連する知識を抽出し、ユーザーに送信
                if data and data['data']:
                    first_result = data['data'][0]
                    dispatcher.utter_message(text=f"'{query}'に関する情報が見つかりました：{first_result['name']} - {first_result['url']}")
                else:
                    dispatcher.utter_message(text="申し訳ありませんが、ナレッジベースに関連情報が見つかりませんでした。")
            except requests.exceptions.RequestException as e:
                dispatcher.utter_message(text=f"ナレッジベースのクエリ中にエラーが発生しました：{e}")

            return []
    ```
    `<your_bookstack_api_token_id>`と`<your_bookstack_api_token_secret>`をBookStack APIトークンに置き換えてください。

2.  **osTicket API統合**：
    *   **APIキーの取得**：osTicketで、Rasa用のAPIキーを作成する必要があります。osTicket管理者パネルにログインし、「Admin Panel」->「Manage」->「API Keys」に移動し、新しいAPIキーを追加します。このキーに、チケット作成の権限など、適切な権限を割り当ててください。APIキーを記録します。
    *   **Rasaカスタムアクションの記述**：`actions`フォルダに、osTicketのAPIを呼び出すPythonコードを記述します。例えば、Rasaがユーザーの問題を解決できない場合、アクションをトリガーして、osTicketに新しいチケットを自動的に作成できます。
    ```python
    # actions/actions.py 例の抜粋
    import requests
    import json
    from rasa_sdk import Action, Tracker
    from rasa_sdk.executor import CollectingDispatcher
    from typing import Any, Text, Dict, List

    class ActionCreateTicket(Action):
        def name(self) -> Text:
            return "action_create_ticket"

        def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
            user_query = tracker.latest_message['text']
            osticket_api_url = "http://osticket:80/api/tickets.json" # Docker Compose内部サービス名
            api_key = "<your_osticket_api_key>"

            headers = {
                "X-API-Key": api_key,
                "Content-Type": "application/json"
            }
            # 対話からユーザー名とメールアドレスを抽出したと仮定
            user_name = tracker.get_slot("user_name") or "Guest"
            user_email = tracker.get_slot("user_email") or "guest@example.com"

            ticket_data = {
                "alert": True,
                "autorespond": True,
                "source": "API",
                "name": user_name,
                "email": user_email,
                "subject": f"AI Helpdesk 自動作成チケット: {user_query[:50]}...",
                "message": f"ユーザーのクエリ: {user_query}\n\nAI Helpdeskは自動的にこの問題を解決できませんでした。チケットが自動的に作成されました。",
                "ip": tracker.sender_id, # sender_idをIPアドレスの例として使用
                "attachments": []
            }

            try:
                response = requests.post(osticket_api_url, headers=headers, data=json.dumps(ticket_data))
                response.raise_for_status()
                ticket_id = response.json().get('number')
                dispatcher.utter_message(text=f"チケットが作成されました。チケット番号：{ticket_id}。IT担当者ができるだけ早く問題に対応します。")
            except requests.exceptions.RequestException as e:
                dispatcher.utter_message(text=f"チケット作成中にエラーが発生しました：{e}")

            return []
    ```
    `<your_osticket_api_key>`をosTicket APIキーに置き換えてください。

3.  **Rasaドメインファイルとトレーニングデータの更新**：
    Rasaの`domain.yml`ファイルで、新しいカスタムアクションを宣言します。`data/stories.yml`で、これらのアクションをトリガーする新しいストーリーを作成します。例えば：
    ```yaml
    # domain.yml 例の抜粋
    actions:
      - action_search_knowledge_base
      - action_create_ticket

    # stories.yml 例の抜粋
    - story: search knowledge and create ticket
      steps:
      - intent: ask_it_question
      - action: action_search_knowledge_base
      - action: utter_no_knowledge_found
      - action: action_create_ticket
    ```

4.  **Rasaモデルの再トレーニング**：
    カスタムアクションコード、ドメインファイル、トレーニングデータを変更した後、変更を有効にするためにRasaモデルを再トレーニングし、Rasa Xに新しいモデルを導入することを忘れないでください。

### 4.2 自動知識整理モジュール

要件定義書では、自動知識整理モジュールはオープンソースライブラリを使用してカスタム開発できると述べられています。この部分は通常、対話ログと解決済みのチケットを分析し、新しい知識ポイントを特定してナレッジベースに自動的に追加するために、自然言語処理（NLP）技術を伴います。この部分はカスタム開発であるため、ここでは高レベルの実装のアイデアと関連するオープンソースライブラリを提供します。

1.  **データ収集**：
    *   **対話ログ**：Rasaの対話履歴ストレージから取得します（例えば、PostgreSQLデータベースからRasaのイベントテーブルを直接読み取ります）。
    *   **チケットデータ**：osTicketのデータベースから解決済みのチケットコンテンツを取得します。

2.  **データ前処理**：
    Pythonを使用して、ストップワード、句読点、HTMLタグなどを削除するなど、テキストのクリーニングを行います。`spaCy`を使用して、トークン化、品詞タグ付け、固有表現認識を行うことができます。

3.  **知識ポイントの抽出**：
    *   **頻繁な問題の特定**：対話ログのクラスタリング分析を実行して、頻繁に発生するユーザーのクエリを特定します。`scikit-learn`のクラスタリングアルゴリズム（K-Meansなど）を使用できます。
    *   **ソリューションの抽出**：解決済みのチケットの説明とソリューションフィールドを分析し、重要な情報を抽出します。`sentence-transformers`を使用してテキスト埋め込みを生成し、類似度マッチングまたはクラスタリングを実行できます。
    *   **テキスト要約**：長いソリューションの場合、テキスト要約技術（例えば、`transformers`ライブラリに基づく事前学習済みモデル）を使用して、簡潔な知識ポイントを生成できます。

4.  **ナレッジベースの更新**：
    BookStackのAPIを介して、抽出された新しい知識ポイントをナレッジベースに自動的に追加します。これには、この操作を実行するためのPythonスクリプトを記述する必要があります。

5.  **ユーザーフィードバックメカニズム**：
    WebchatインターフェースまたはBookStackで、ユーザーがナレッジベースコンテンツの誤りや古い情報を報告できるメカニズムを提供します。これは、ナレッジベースの品質を継続的に向上させるのに役立ちます。

### 4.3 システムテスト

すべてのコンポーネントの導入と統合が完了したら、AIヘルプデスクシステムが期待どおりに機能することを確認するために、包括的なシステムテストを行うことが不可欠です。これには、機能テスト、パフォーマンステスト、セキュリティテストが含まれます。

1.  **機能テスト**：
    *   **対話型AIテスト**：Rasa Webchatを介してAIヘルプデスクと対話し、さまざまなユーザーのクエリを理解する能力、応答の正確性、およびカスタムアクション（ナレッジベースの検索、チケットの作成など）を正しくトリガーできるかどうかをテストします。
    *   **ナレッジベース機能テスト**：BookStackでナレッジ記事を作成、編集、削除し、Rasaがこれらの情報を正しく取得できるかどうかをテストします。
    *   **チケットシステム機能テスト**：AIヘルプデスクがチケットを正常に作成できるかどうか、およびIT担当者がosTicketでチケットを表示、処理、クローズできるかどうかをテストします。
    *   **自動知識整理モジュールテスト**：このモジュールが開発されている場合、データが正しく分析され、ナレッジベースが更新されるかどうかをテストします。

2.  **パフォーマンステスト**：
    *   **同時ユーザーテスト**：複数の同時ユーザーがAIヘルプデスクと対話するのをシミュレートし、システム応答時間が2秒以内であるかどうか、およびシステムリソース（CPU、メモリ）の使用状況を観察します。Apache JMeterやLocustなどのツールを使用して負荷テストを実行できます。
    *   **データベースパフォーマンス**：PostgreSQLのパフォーマンスを監視し、高負荷時でもデータベースが迅速に応答することを確認します。

3.  **セキュリティテスト**：
    *   **HTTPS設定**：すべてのWebインターフェースとAPIがHTTPSを介してアクセスされ、SSL証明書が有効であることを確認します。
    *   **認証と認可**：異なるユーザーロール（エンドユーザー、IT担当者、管理者）のアクセス権限が正しいことをテストします。
    *   **機密データの暗号化**：保存されたパスワードと機密データが暗号化されていることを確認します。
    *   **脆弱性スキャン**：OWASP ZAPやNessusなどのツールを使用して、システムの脆弱性スキャンを実行します。

## 5. メンテナンスと最適化

システムの導入後、AIヘルプデスクシステムが長期的に安定して動作し、継続的に改善されるように、継続的なメンテナンスと最適化が重要です。

### 5.1 定期的な更新

*   **オペレーティングシステムの更新**：Windows 11の最新の更新プログラムを定期的に確認し、インストールします。
*   **Dockerイメージの更新**：Docker Composeファイルで使用されているすべてのコンポーネントのDockerイメージを最新の安定バージョンに定期的に更新します。例えば、`postgres:13`は`postgres:latest`またはより新しい特定のバージョンに更新できます。更新する前に、新しいバージョンのリリースノートを確認し、互換性のない変更がないか確認してください。
*   **Rasaモデルの更新**：新しい対話データと知識が蓄積されるにつれて、Rasaモデルを定期的に再トレーニングし、理解能力と応答の正確性を向上させます。
*   **オープンソースライブラリの更新**：自動知識整理モジュールがPythonオープンソースライブラリを使用している場合、これらのライブラリを最新バージョンに定期的に更新します。

### 5.2 バックアップと復元

データの損失を防ぐために、堅牢なバックアップと復元戦略を実装することが不可欠です。

*   **データベースのバックアップ**：PostgreSQLデータベースを定期的にバックアップします。`pg_dump`ツールを使用してデータベースの論理バックアップを作成したり、Dockerボリュームバックアップツールを使用してデータボリューム全体をバックアップしたりできます。
    ```bash
    # 例：PostgreSQLデータベースのバックアップ
    docker exec ai_helpdesk_postgresql pg_dump -U ai_helpdesk_user ai_helpdesk_db > /path/to/backup/ai_helpdesk_db_backup_$(date +%Y%m%d%H%M%S).sql
    ```
*   **BookStackとosTicketのデータバックアップ**：データベースに加えて、BookStackとosTicketのデータボリューム（例：`bookstack_data`と`osticket_data`）もバックアップする必要があります。これらのボリュームには、アップロードされたファイルと設定情報が含まれています。
*   **Rasaモデルのバックアップ**：トレーニング済みのRasaモデルファイルをバックアップし、必要に応じて迅速に復元できるようにします。

### 5.3 監視とログ

*   **システムリソースの監視**：Windowsのタスクマネージャーまたはパフォーマンスモニター、およびDocker Desktopの統計情報を使用して、サーバーのCPU、メモリ、ディスクI/O、およびネットワークの使用状況を監視します。リソース使用率が継続的に高い場合は、ハードウェアのアップグレードまたは設定の最適化が必要になる場合があります。
*   **アプリケーションログ**：Rasa、BookStack、osTicketなどのコンポーネントのログを定期的に確認し、問題をタイムリーに発見して解決します。`docker compose logs`コマンドを使用してコンテナログを表示できます。
*   **エラーアラート**：システムに重大なエラーが発生したり、パフォーマンスが低下したりした場合に、IT担当者にタイムリーに通知するアラートメカニズムを設定します。

### 5.4 パフォーマンスの最適化

*   **データベースの最適化**：PostgreSQLデータベースの定期的なメンテナンス（VACUUM、インデックス最適化など）を実行して、クエリパフォーマンスを向上させます。
*   **Rasaモデルの最適化**：Rasaモデルの意図認識とエンティティ抽出を最適化し、誤認識を減らします。異なるRasaパイプライン設定を試したり、トレーニングデータを増やしたりすることができます。
*   **Webサーバーの最適化**：リバースプロキシ（NginxやApacheなど）を使用している場合、Gzip圧縮、ブラウザキャッシュなどを有効にするなど、その設定を最適化してWebインターフェースのロード速度を向上させます。

## 6. セキュリティのベストプラクティス

要件定義書に記載されているセキュリティ要件に加えて、AIヘルプデスクシステムのセキュリティを確保するための追加のセキュリティベストプラクティスを以下に示します。

*   **最小権限の原則**：各サービスとデータベースユーザーに最小限必要な権限を割り当てます。例えば、BookStackとosTicketのデータベースユーザーは、それぞれのデータベースに対する読み書き権限のみを持ち、PostgreSQLサーバー全体に対する完全な権限を持つべきではありません。
*   **強力なパスワードポリシー**：管理者やAPIユーザーを含むすべてのユーザーに、複雑で定期的に変更される強力なパスワードの使用を強制します。
*   **定期的な脆弱性スキャン**：侵入テストに加えて、自動化ツールを使用して定期的に脆弱性スキャンを実行し、既知の脆弱性をタイムリーに発見して修正します。
*   **ログ監査**：システムおよびアプリケーションログを定期的に確認し、異常なアクティビティや潜在的なセキュリティイベントを探します。
*   **ネットワーク分離**：可能であれば、データベースサーバー、Rasaサービス、Webサービスを異なるネットワークセグメントに導入し、ファイアウォールルールを使用してそれらの間の通信を制限します。
*   **HTTPSの強制**：すべてのHTTPリクエストがHTTPSに強制的にリダイレクトされるようにします。これは、Webサーバー（ApacheやNginxなど）の設定で実現できます。
*   **Dockerセキュリティ**：
    *   **公式イメージの使用**：公式に提供されているDockerイメージを優先的に使用します。これらは通常、より安全で安定しています。
    *   **イメージの定期的な更新**：セキュリティパッチを取得するために、イメージを最新バージョンにタイムリーに更新します。
    *   **非rootユーザーでコンテナを実行**：Dockerfileでは、潜在的なセキュリティリスクを減らすために、非rootユーザーでコンテナを実行するように努めます。

## 7. 付録

### 7.1 よく使用されるDockerコマンド

*   `docker ps`：実行中のすべてのコンテナを一覧表示します。
*   `docker ps -a`：すべてのコンテナ（停止中のものも含む）を一覧表示します。
*   `docker stop <container_name_or_id>`：実行中の1つまたは複数のコンテナを停止します。
*   `docker start <container_name_or_id>`：停止中の1つまたは複数のコンテナを起動します。
*   `docker restart <container_name_or_id>`：1つまたは複数のコンテナを再起動します。
*   `docker rm <container_name_or_id>`：1つまたは複数のコンテナを削除します。
*   `docker rmi <image_name_or_id>`：1つまたは複数のイメージを削除します。
*   `docker logs <container_name_or_id>`：コンテナのログを表示します。
*   `docker exec -it <container_name_or_id> bash`：実行中のコンテナ内部でコマンドを実行します（通常はデバッグ用）。
*   `docker volume ls`：すべてのDockerボリュームを一覧表示します。
*   `docker volume rm <volume_name>`：1つまたは複数のDockerボリュームを削除します。

### 7.2 トラブルシューティング

*   **コンテナが起動しない**：
    *   `docker compose logs <service_name>`で具体的なエラーメッセージを確認します。
    *   ポートが使用中かどうかを確認します。`netstat -ano`コマンドを使用してWindows上のポート使用状況を確認できます。
    *   `docker-compose.yml`ファイルの構文が正しいことを確認します。
    *   リソースが十分であるか（CPU、メモリ）を確認します。
*   **Webインターフェースにアクセスできない**：
    *   コンテナが実行中であるかを確認します (`docker compose ps`)。
    *   ファイアウォールが対応するポートを開放しているかを確認します。
    *   `docker-compose.yml`のポートマッピングが正しいことを確認します。
    *   アプリケーションの内部ログを確認し、起動エラーがないか確認します。
*   **Rasaモデルのトレーニングが失敗する**：
    *   Rasaトレーニングデータ（`nlu.yml`、`stories.yml`、`domain.yml`）に構文エラーや不整合がないか確認します。
    *   Rasa Xコンテナのログを確認します。
    *   モデルのトレーニングに十分なメモリがあることを確認します。
*   **カスタムアクションが機能しない**：
    *   `rasa_action_server`コンテナのログを確認します。
    *   カスタムアクションコードに構文エラーがないことを確認します。
    *   `actions`フォルダがコンテナ内部に正しくマッピングされていることを確認します。
    *   `domain.yml`でカスタムアクションが宣言されており、ストーリーで正しくトリガーされていることを確認します。
    *   `rasa_action_server`コンテナを再起動します。

## 8. まとめ

このガイドでは、Windows 11サーバー上にAIヘルプデスクシステムを導入する際の、環境準備からコンポーネントの導入、システム統合、テスト、そしてその後のメンテナンスと最適化に至るまで、あらゆる側面を詳細に説明しました。このガイドの手順に従うことで、強力で安全かつ信頼性の高いAIヘルプデスクシステムを正常に導入し、ITサポートの効率とユーザー満足度を向上させることができます。Dockerとこれらのオープンソースツールを習得するには、継続的な学習と実践が重要であることを忘れないでください。導入が成功することを願っています！

---

**著者：** Manus AI
**日付：** 2025年7月11日





*   **コンテンツアクセスセキュリティ**：
    *   IT部門がナレッジベース内の機密コンテンツをマークできるメカニズムを実装します。
    *   Rasaのカスタムアクションに、ユーザーのクエリが機密情報の返却につながる可能性があるかどうかをチェックするロジックを統合します。潜在的な機密情報漏洩が検出された場合、AIは実際の内容を返さず、代わりに事前定義された拒否メッセージ（例：「お問い合わせには機密情報が含まれているため、お答えできません。」）を返します。これには、コンテンツの機密性タグを取得するためにBookStackのAPIとのより深い統合が必要になるか、RasaのNLUモデルで機密トピックを識別するようにトレーニングする必要がある場合があります。




*   **コンテンツアクセスセキュリティ**：
    *   IT部門がナレッジベース内の機密コンテンツをマークできるメカニズムを実装します。
    *   Rasaのカスタムアクションに、ユーザーのクエリが機密情報の返却につながる可能性があるかどうかをチェックするロジックを統合します。潜在的な機密情報漏洩が検出された場合、AIは実際の内容を返さず、代わりに事前定義された拒否メッセージ（例：「お問い合わせには機密情報が含まれているため、お答えできません。」）を返します。これには、コンテンツの機密性タグを取得するためにBookStackのAPIとのより深い統合が必要になるか、RasaのNLUモデルで機密トピックを識別するようにトレーニングする必要がある場合があります。


